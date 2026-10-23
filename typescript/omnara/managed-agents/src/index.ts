/*
 * Copyright Daytona Platforms Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

// `npm run start`: launch the agent on a Daytona sandbox from the pool that
// `npm run setup` created, then send it two messages and stream its work.

// Load OMNARA_API_KEY and OMNARA_ORG_ID from .env.
import 'dotenv/config'
import { readFile } from 'node:fs/promises'
import { setTimeout as sleep } from 'node:timers/promises'
import type { OmnaraClient } from '@omnara/sdk'
import { openAgentEventStream, sdk } from '@omnara/sdk'
import { AGENT_FILE, AGENT_NAME, OMNARA_APP_URL, followUpInput, initialInput } from './config.js'
import { findPool, findProject, omnaraClient, resolveOrg } from './omnara.js'
import { Renderer, RULE, turnResult } from './render.js'

// Stop if the agent's stream is silent this long, so the demo never hangs.
const IDLE_TIMEOUT_MS = 5 * 60 * 1000

// How long to wait for the Daytona sandbox to start and its Omnara daemon to
// connect.
const MACHINE_TIMEOUT_MS = 3 * 60 * 1000

// Wait until the agent's machine is online: Omnara has created the Daytona
// sandbox and the Omnara daemon inside it has connected. Omnara retries a
// failed sandbox twice, then deletes the machine.
async function waitForMachine(client: OmnaraClient, orgID: string, poolID: string, machineID: string): Promise<void> {
  const deadline = Date.now() + MACHINE_TIMEOUT_MS
  let state = 'not created yet'
  while (Date.now() < deadline) {
    const { data } = await sdk.listVisibleMachines({ client, path: { orgID }, query: { machine_pool_id: poolID } })
    const machine = data.data.find((item) => item.id === machineID)
    if (machine?.connection_state === 'online') return
    if (machine && ['deleting', 'delete_failed', 'deleted'].includes(machine.lifecycle_state)) {
      throw new Error(
        "Omnara couldn't create the Daytona sandbox. Check that the Daytona API key you gave setup is still " +
          'valid and has the `write:sandboxes` and `delete:sandboxes` permissions, and check your Daytona ' +
          'limits at https://app.daytona.io/dashboard/limits.',
      )
    }
    if (machine) state = `${machine.lifecycle_state}, ${machine.connection_state}`
    await sleep(2_000)
  }
  throw new Error(`The machine didn't come online within ${MACHINE_TIMEOUT_MS / 60_000} minutes (${state}).`)
}

async function main(): Promise<void> {
  const client = omnaraClient()
  const orgID = await resolveOrg(client)
  const [project, machinePool] = await Promise.all([findProject(client, orgID), findPool(client, orgID)])
  if (!project || !machinePool) throw new Error('Run `npm run setup` first.')
  const projectID = project.id

  // One call compiles agent.yaml and launches the agent. Omnara starts creating
  // the Daytona sandbox right away; the first message goes out once it's ready.
  const launchedAt = Date.now()
  const { data: launched } = await sdk.createAgent({
    client,
    path: { orgID, projectID },
    body: { config_source: { source: await readFile(AGENT_FILE, 'utf8'), source_format: 'yaml' }, name: AGENT_NAME },
  })
  const agentID = launched.agent.id
  const agent = { orgID, projectID, agentID }
  console.log(`Launched agent ${agentID}`)
  console.log(`Watch it live: ${OMNARA_APP_URL}/projects/${projectID}/agents/${agentID}`)

  // Stop the agent's current turn (the agent itself stays), but never wait
  // more than 5 seconds so Ctrl+C stays responsive.
  const stopTurn = () => sdk.cancelAgent({ client, path: agent, signal: AbortSignal.timeout(5_000) }).catch(() => {})
  process.once('SIGINT', () => {
    console.log("\nStopping the agent's current turn...")
    void stopTurn().finally(() => process.exit(130))
  })

  const machineID = 'machine_bindings' in launched ? launched.machine_bindings[0]?.machine_id : undefined
  if (!machineID) throw new Error(`The agent launched without a machine; check machine_sources in ${AGENT_FILE}`)
  console.log('Waiting for the Daytona sandbox...')
  await waitForMachine(client, orgID, machinePool.id, machineID)
  console.log(`The agent's Daytona sandbox is ready after ${Math.round((Date.now() - launchedAt) / 1000)}s`)

  // Send each message once the previous turn succeeds. The SDK follows the
  // agent's timeline from the start and reconnects on its own after network
  // errors.
  const messages = [initialInput, followUpInput]
  const send = (text: string) =>
    sdk.createAgentInput({ client, path: agent, body: { content_blocks: [{ type: 'text', text }] } })
  await send(messages.shift()!)

  const renderer = new Renderer()
  const controller = new AbortController()
  let timer: ReturnType<typeof setTimeout> | undefined
  const arm = () => {
    clearTimeout(timer)
    timer = setTimeout(() => controller.abort(), IDLE_TIMEOUT_MS)
  }
  arm()
  let outcome: 'done' | 'failed' | 'timeout' = 'timeout'
  for await (const frame of openAgentEventStream({
    client,
    path: agent,
    query: { after_sequence: 0 },
    signal: controller.signal,
  })) {
    arm()
    renderer.handle(frame)
    const result = turnResult(frame)
    if (result === undefined) continue
    if (result !== 'end_turn') {
      console.error(`\nThe agent's turn ended without finishing (${result}).`)
      outcome = 'failed'
      break
    }
    const next = messages.shift()
    if (next === undefined) {
      outcome = 'done'
      break
    }
    await send(next)
  }
  clearTimeout(timer)
  if (outcome === 'timeout') {
    console.error(`\nNo activity for ${IDLE_TIMEOUT_MS / 60_000} minutes; stopping the agent's current turn.`)
    await stopTurn()
  }
  if (outcome !== 'done') process.exitCode = 1

  const { data: usage } = await sdk.getAgentUsage({ client, path: agent })
  const { tokens, cost } = usage.totals
  console.log(`\n${RULE}`)
  console.log(
    `Model usage: ${tokens.input_tokens_total.toLocaleString()} input and ` +
      `${tokens.output_tokens_total.toLocaleString()} output tokens` +
      (cost.model_calls_with_reported_cost > 0 ? ` ($${Number(cost.provider_reported_usd).toFixed(4)})` : ''),
  )
  console.log(
    'The agent keeps running in Omnara, so you can keep talking to it from the link above. Its sandbox is ' +
      'deleted after it sits idle. Run `npm run cleanup` to remove everything this guide created.',
  )
}

main().catch((error) => {
  console.error('An error occurred:', error instanceof Error ? error.message : error)
  process.exit(1)
})

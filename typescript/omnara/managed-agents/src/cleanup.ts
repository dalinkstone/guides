/*
 * Copyright Daytona Platforms Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

// `npm run cleanup`: delete everything `npm run setup` created. Deleting the
// project archives its agents, and deleting the pool deletes their Daytona
// sandboxes.

// Load OMNARA_API_KEY and OMNARA_ORG_ID from .env.
import 'dotenv/config'
import { setTimeout as sleep } from 'node:timers/promises'
import { ApiError, sdk } from '@omnara/sdk'
import { POOL_NAME, PROJECT_NAME, SECRET_NAME } from './config.js'
import { findPool, findProject, findSecret, omnaraClient, resolveOrg } from './omnara.js'

// Omnara keeps a deleted pool's credential until its sandboxes finish deleting,
// and refuses to delete the secret (409) until then.
const SECRET_DELETE_TIMEOUT_MS = 3 * 60 * 1000

async function main(): Promise<void> {
  const client = omnaraClient()
  const orgID = await resolveOrg(client)

  const project = await findProject(client, orgID)
  if (project) await sdk.deleteProject({ client, path: { orgID, projectID: project.id } })
  console.log(`Project ${PROJECT_NAME}: ${project ? 'deleted' : 'not found'}`)

  const machinePool = await findPool(client, orgID)
  if (machinePool) await sdk.deleteMachinePool({ client, path: { orgID, poolID: machinePool.id } })
  console.log(`Machine pool ${POOL_NAME}: ${machinePool ? 'deleted' : 'not found'}`)

  const secret = await findSecret(client, orgID)
  if (!secret) {
    console.log(`Secret ${SECRET_NAME}: not found`)
    return
  }
  const deadline = Date.now() + SECRET_DELETE_TIMEOUT_MS
  let waiting = false
  for (;;) {
    try {
      await sdk.deleteSecret({ client, path: { orgID, secretID: secret.id } })
      console.log(`Secret ${SECRET_NAME}: deleted`)
      return
    } catch (err) {
      if (!(err instanceof ApiError && err.status === 409)) throw err
      if (Date.now() > deadline) {
        throw new Error(
          `Omnara is still deleting the pool's machines, so ${SECRET_NAME} can't be deleted yet. ` +
            'Run `npm run cleanup` again in a few minutes.',
        )
      }
      if (!waiting) console.log(`Secret ${SECRET_NAME}: waiting for the pool's machines to finish deleting...`)
      waiting = true
      await sleep(10_000)
    }
  }
}

main().catch((error) => {
  console.error('An error occurred:', error instanceof Error ? error.message : error)
  process.exit(1)
})

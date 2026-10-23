/*
 * Copyright Daytona Platforms Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

export const OMNARA_API_URL = 'https://api.omnara.com/v1'
export const OMNARA_APP_URL = 'https://app.omnara.com'

// The agent definition, relative to the guide folder (where `npm run start`
// runs). Its machine source must name POOL_NAME below.
export const AGENT_FILE = 'agent.yaml'
export const AGENT_NAME = 'Machine assistant'

// Omnara resources that `npm run setup` creates and `npm run cleanup` deletes.
export const PROJECT_NAME = 'daytona-guide'
export const SECRET_NAME = 'daytona-guide-api-key'
export const POOL_NAME = 'daytona-guide'

// The Daytona machine pool. Omnara creates one sandbox per agent from it,
// using your Daytona API key, and deletes the sandbox when it has been idle for
// `deleteAfterIdleMinutes` or the agent is archived.
export const pool = {
  // daytona-small is 1 vCPU and 1 GiB, so several runs fit in Daytona's Tier 1
  // limits at once. The README lists what a custom snapshot needs.
  snapshot: 'daytona-small',
  // Daytona region: `us`, `eu`, or a custom region ID.
  target: 'us',
  // Omnara-side limits for the whole pool and for each sandbox. Each sandbox
  // limit must be at least the snapshot's size. Daytona's own organization
  // limits still apply on top of these.
  maxTotalMachines: 5,
  maxTotalCpu: 5,
  maxTotalMemoryMb: 5120,
  maxMachineCpu: 1,
  maxMachineMemoryMb: 1024,
  // The agent stays after the run, so this is what removes its sandbox.
  deleteAfterIdleMinutes: 30,
}

// The messages from Omnara's quickstart: one that needs both the machine and
// the web, and a follow-up that builds on the answer.
export const initialInput =
  'Use your machine to report the operating system and the free disk space. Then find the latest ' +
  'stable Node.js release on the web and tell me the version.'
export const followUpInput = 'Install that Node.js version on the machine and show me node --version.'

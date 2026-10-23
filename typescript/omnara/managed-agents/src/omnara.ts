/*
 * Copyright Daytona Platforms Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type { MachinePool, OmnaraClient, Project, Secret } from '@omnara/sdk'
import { bearerToken, createOmnaraClient, sdk } from '@omnara/sdk'
import { OMNARA_API_URL, POOL_NAME, PROJECT_NAME, SECRET_NAME } from './config.js'

// Lookups shared by the setup, demo, and cleanup scripts. Each one finds the
// resource this guide created by name.

export function omnaraClient(): OmnaraClient {
  const apiKey = process.env.OMNARA_API_KEY
  if (!apiKey) {
    console.error('Error: set OMNARA_API_KEY in .env (see .env.example)')
    process.exit(1)
  }
  return createOmnaraClient({ baseUrl: OMNARA_API_URL, auth: bearerToken(apiKey) })
}

// The organization to work in: OMNARA_ORG_ID, or the token's only one.
export async function resolveOrg(client: OmnaraClient): Promise<string> {
  const { data } = await sdk.listOrganizations({ client })
  const orgs = data.data
  if (orgs.length === 0) throw new Error("This token doesn't belong to any Omnara organization.")
  const ids = orgs.map((item) => `${item.name} (${item.id})`).join(', ')
  const wanted = process.env.OMNARA_ORG_ID
  if (wanted) {
    const org = orgs.find((item) => item.id === wanted)
    if (!org) throw new Error(`OMNARA_ORG_ID ${wanted} is not one of this token's organizations: ${ids}`)
    return org.id
  }
  if (orgs.length === 1) return orgs[0].id
  throw new Error(`This token can reach several organizations. Set OMNARA_ORG_ID to one of: ${ids}`)
}

export async function findProject(client: OmnaraClient, orgID: string): Promise<Project | undefined> {
  let cursor: string | undefined
  do {
    const { data } = await sdk.listVisibleProjects({ client, path: { orgID }, query: { cursor } })
    const match = data.data.find((project) => project.name === PROJECT_NAME)
    if (match) return match
    cursor = data.next_cursor ?? undefined
  } while (cursor)
  return undefined
}

export async function findPool(client: OmnaraClient, orgID: string): Promise<MachinePool | undefined> {
  const { data } = await sdk.listMachinePools({ client, path: { orgID }, query: { name: POOL_NAME } })
  return data.data.find((pool) => pool.name === POOL_NAME)
}

export async function findSecret(client: OmnaraClient, orgID: string): Promise<Secret | undefined> {
  const { data } = await sdk.listSecrets({ client, path: { orgID }, query: { owner_kind: 'org', name: SECRET_NAME } })
  return data.data.find((secret) => secret.name === SECRET_NAME)
}

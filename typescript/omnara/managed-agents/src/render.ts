/*
 * Copyright Daytona Platforms Inc.
 * SPDX-License-Identifier: Apache-2.0
 */

import type { AgentEventStreamFrame } from '@omnara/sdk'

// Enable ANSI styling only when writing to a real terminal, so redirected or
// piped output (files, CI logs) stays clean plain text.
const useColor = process.stdout.isTTY === true
const BOLD = useColor ? '\x1b[1m' : ''
const DIM = useColor ? '\x1b[2m' : ''
const RESET = useColor ? '\x1b[0m' : ''

export const RULE = '-'.repeat(60)

// Strip terminal escape sequences and C0, DEL, and C1 control characters from
// model and tool text so agent output can't spoof the console. Tabs and
// newlines are kept.
function sanitize(text: string): string {
  return text.replace(/\u001B\[[0-9;?]*[ -/]*[@-~]/g, '').replace(/[\u0000-\u0008\u000B-\u001F\u007F-\u009F]/g, '')
}

function oneLine(text: string, max = 100): string {
  const flat = sanitize(text).replace(/\s+/g, ' ').trim()
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat
}

// If this frame ends the agent's turn, how it ended: `end_turn` when the agent
// finished; `error`, `refusal`, or `content_filter` when it didn't (a failed
// model call is saved as a model response with stop reason `error`); or
// `canceled` when someone stopped the turn from the Omnara dashboard.
// Otherwise undefined: a response that calls tools or hit the output limit is
// followed by more work in the same turn.
export function turnResult(frame: AgentEventStreamFrame): string | undefined {
  if (!('event_kind' in frame)) return undefined
  if (frame.event_kind === 'agent_input' && frame.input_kind === 'control') return 'canceled'
  if (frame.event_kind !== 'model_output') return undefined
  if (frame.stop_reason === 'tool_use' || frame.stop_reason === 'max_tokens') return undefined
  if (frame.content_blocks.some((block) => block.type === 'tool_call')) return undefined
  return frame.stop_reason
}

// The argument worth showing for a tool call: the command for run_command,
// the query for web_search, the URL for web_fetch.
function mainArgument(input: Record<string, unknown>): string {
  for (const key of ['command', 'query', 'url']) {
    if (typeof input[key] === 'string') return oneLine(input[key] as string)
  }
  return ''
}

// Prints the agent's timeline as it streams: your messages, the agent's
// replies, each tool call with its main argument, and each tool's outcome.
export class Renderer {
  private toolNames = new Map<string, string>()

  handle(frame: AgentEventStreamFrame): void {
    // Live updates (tool call states, text previews) aren't saved events; skip them.
    if (!('event_kind' in frame)) return
    switch (frame.event_kind) {
      case 'agent_input': {
        if (frame.input_kind !== 'content') return
        const text = frame.content_blocks.map((block) => (block.type === 'text' ? block.text : '')).join('')
        if (text) console.log(`\n${RULE}\n${BOLD}User:${RESET} ${sanitize(text)}`)
        return
      }
      case 'model_output': {
        for (const block of frame.content_blocks) {
          if (block.type === 'text' && block.text.trim()) {
            console.log(`\n${BOLD}Agent:${RESET} ${sanitize(block.text.trim())}`)
          } else if (block.type === 'tool_call') {
            this.toolNames.set(block.tool_call_id, block.name)
            const argument = mainArgument(block.input)
            console.log(`${DIM}  -> ${sanitize(block.name)}${argument ? `  ${argument}` : ''}${RESET}`)
          } else if (block.type === 'error') {
            console.log(`${DIM}  ! ${oneLine(block.text)}${RESET}`)
          }
        }
        return
      }
      case 'tool_result': {
        const name = this.toolNames.get(frame.tool_call_id) ?? 'tool'
        console.log(`${DIM}     ${sanitize(name)} ${frame.outcome}${RESET}`)
        return
      }
    }
  }
}

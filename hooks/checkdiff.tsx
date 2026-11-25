/**
 * Feature: check-diff's verdict under each edit. After a successful file edit
 * it runs the skill's own check-diff on that file's changed lines and keeps the
 * result, which is drawn under the edit's row: clean in green, dangers in red.
 * It is for the person only; the command hook in hooks.json still hands the
 * findings to Claude.
 */
import { atom, read, update } from 'claude-code'
import type { ElementTable, EngineInterface } from 'claude-code'

import type { CheckResult } from '../types'
import { parseCheck, tally } from './checkdiff-parse'

const EDIT_TOOLS = new Set(['Edit', 'Write', 'MultiEdit'])
const KEEP = 100
const SHOWN = 3
const results = atom({ plugin: 'agent-skill-ultimate-coding', key: 'checkdiff' } as const, {})

/** Sets one edit's result, keeping only the newest KEEP. */
const withResult = (all: Record<string, CheckResult>, id: string, r: CheckResult): Record<string, CheckResult> =>
  Object.fromEntries([...Object.entries(all).filter(([k]) => k !== id), [id, r]].slice(-KEEP))

/** A finished tool call of the main loop: check a successful edit's file. */
export async function checkdiffTool($: EngineInterface, tool: string, id: string, input: unknown, ran: { deny?: string; isError?: boolean }) {
  if (!EDIT_TOOLS.has(tool) || ran.deny !== undefined || ran.isError === true) return
  const file = (input as { file_path?: unknown }).file_path
  if (typeof file !== 'string') return
  await update($, results, all => withResult(all, id, { status: 'checking' }))
  let result: CheckResult
  try {
    // argv, no shell: the path is handed over as data, never parsed as a command.
    const out = await $.process.run(['bash', `${$.plugin.root}/skills/agent-skill-ultimate-coding/scripts/check-diff.sh`, '--hook'], {
      stdin: JSON.stringify({ tool_input: { file_path: file } }),
      env: { CLAUDE_PROJECT_DIR: await $.session.cwd() },
    })
    result = parseCheck(out.exitCode, out.stdout)
  } catch (err) {
    result = { status: 'error', message: String(err).slice(0, 120) }
  }
  await update($, results, all => withResult(all, id, result))
}

/** The session's clean and with-dangers counts, for the scorecard. */
export async function checkdiffCounts($: EngineInterface): Promise<{ clean: number; found: number }> {
  return tally(await read($, results))
}

/** What to draw under an edit's row, or null when there is nothing for it. */
export async function checkdiffUnderRow($: EngineInterface, tool: string, id: string, ui: Pick<ElementTable, 'Box' | 'Text'>) {
  if (!EDIT_TOOLS.has(tool)) return null
  const r = (await read($, results))[id]
  if (r === undefined) return null
  const { Box, Text } = ui
  if (r.status === 'checking') return <Text dimColor>  ↳ check-diff: checking…</Text>
  if (r.status === 'clean') return <Text color="#4ade80">  ↳ check-diff: clean</Text>
  if (r.status === 'error') return <Text color="#fbbf24">  ↳ check-diff could not run: {r.message}</Text>
  return (
    <Box flexDirection="column">
      <Text color="#f87171">  ↳ check-diff: {r.findings.length} possible danger{r.findings.length === 1 ? '' : 's'}</Text>
      {r.findings.slice(0, SHOWN).map(f => <Text color="#f87171">      line {f.line} · {f.message}</Text>)}
      {r.findings.length > SHOWN && <Text dimColor>      +{r.findings.length - SHOWN} more</Text>}
    </Box>
  )
}

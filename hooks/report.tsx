/**
 * Feature: the report check. When Claude is about to stop after changing code
 * without the skill's report and its confidence, it is asked once to end with
 * them (report-rules.ts holds why and the rules). It keeps the lines edited since
 * the person's last message, and whether the project's own rules set a report
 * format, read once per working directory and then kept.
 */
import { atom, read, update } from 'claude-code'
import type { EngineInterface } from 'claude-code'

import type { PromptKind } from '../types'
import { RULE_FILES, asksOwnReply, editedLines, reportNudge, ruleFolders, setsOwnFormat } from './report-rules'

const lines = atom({ plugin: 'agent-skill-ultimate-coding', key: 'reportLines' } as const, 0)
const ownReply = atom({ plugin: 'agent-skill-ultimate-coding', key: 'personSetReply' } as const, false)
const formats = atom({ plugin: 'agent-skill-ultimate-coding', key: 'projectFormats' } as const, {})
const skillUsed = atom({ plugin: 'agent-skill-ultimate-coding', key: 'skillUsed' } as const, false)

/** The person's new message starts a new count of edited lines, and says whether they asked for a reply of their own kind. */
export async function reportPrompt($: EngineInterface, kind: PromptKind, text: string) {
  if (kind !== 'new') return
  await update($, lines, () => 0)
  await update($, ownReply, () => asksOwnReply(text))
}

/** A finished main-loop tool call: an edit adds its lines. */
export async function reportTool($: EngineInterface, tool: string, input: unknown, ran: { deny?: string; isError?: boolean }) {
  if (ran.deny !== undefined || ran.isError === true) return
  const n = editedLines(tool, input as Record<string, unknown>)
  if (n > 0) await update($, lines, c => c + n)
}

/**
 * Whether the project's own rules (CLAUDE.md, AGENTS.md and the like, in the
 * working directory and its parents up to the home folder) set a report format.
 * Read once per working directory; a file that cannot be read counts as absent.
 */
async function projectHasFormat($: EngineInterface): Promise<boolean> {
  const cwd = await $.session.cwd()
  const known = (await read($, formats)) as Record<string, boolean>
  if (cwd in known) return known[cwd] === true
  const home = (await $.env.get('HOME')) ?? ''
  const paths = ruleFolders(cwd, home).flatMap(dir => RULE_FILES.map(file => `${dir}/${file}`))
  const texts = await Promise.all(paths.map(p => $.fs.read(p).then(t => (typeof t === 'string' ? t : ''), () => '')))
  const found = texts.some(text => text !== '' && setsOwnFormat(text))
  await update($, formats, all => ({ ...(all as Record<string, boolean>), [cwd]: found }))
  return found
}

/** Claude is about to stop: the nudge to send it back for the report, or null to let it stop. */
export async function reportStop($: EngineInterface, e: { stop_hook_active?: boolean; last_assistant_message?: string; background_tasks?: readonly unknown[] }): Promise<string | null> {
  const edited = await read($, lines)
  if (edited === 0) return null                                     // no code changed: skip reading project files
  return reportNudge({
    isContinuing: e.stop_hook_active === true,
    lastMessage: e.last_assistant_message ?? '',
    backgroundTasks: e.background_tasks?.length ?? 0,
    editedLines: edited,
    skillUsed: await read($, skillUsed),
    projectHasFormat: await projectHasFormat($),
    personSetReply: await read($, ownReply),
  })
}

/** The conversation ended (/clear, a resume): its count goes with it. */
export async function reportReset($: EngineInterface) {
  await update($, lines, () => 0)
}

/**
 * The report check's rules. When Claude is about to stop after a turn that
 * changed code, and its last message gives no confidence, it is asked once to
 * end with the skill's report. Written rules alone were followed in about half of
 * real sessions (142 reports, 2026-11-25); a check at the moment of stopping is
 * followed reliably. The project's own rules win: a project whose CLAUDE.md or
 * AGENTS.md sets its own report format is never nudged. Pure, so every rule is
 * tested alone.
 */
import { asksPerson, confidenceOf, hasReport } from './progress'

/** Edits this small (a typo, one value) are trivial tasks, which the skill ends with one short sentence. */
export const TRIVIAL_LINES = 3

/** What the check knows when Claude is about to stop. */
export type StopFacts = {
  /** Claude is already continuing because of a stop hook: never nudge twice. */
  isContinuing: boolean
  /** The message Claude is about to stop on. */
  lastMessage: string
  /** Background work still running: the turn is pausing for it, not finishing. */
  backgroundTasks: number
  /** Lines written by edits since the person's last message. */
  editedLines: number
  /** The skill was loaded in this conversation. */
  skillUsed: boolean
  /** The project's own rules set a report format of their own. */
  projectHasFormat: boolean
  /** The person's own message asked for a different kind of reply (one line, no report, briefly). */
  personSetReply: boolean
}

/** The nudge Claude reads when it stops without the report. */
export const REPORT_NUDGE =
  'Before you finish: this turn changed code, so end with the Ultimate Coding report from the skill: ' +
  'short and plain ("All done!" with the checks only when every item and check passed, otherwise what now works and, in red lines, what is missing), ' +
  'then at the very end your confidence in your own words ("**I have high / medium / low confidence in this change**" with its dot, then because and the evidence), ' +
  'then numbered options when there is a choice (for medium or low: options that raise it, the first one recommended). ' +
  'Rewrite your last message as that report; do not redo or repeat the work. ' +
  'If the person asked in this conversation for a different kind of reply, give them that reply again instead.'

/** Why Claude should continue with the report, or null to let it stop. */
export const reportNudge = (f: StopFacts): string | null => {
  if (f.isContinuing || !f.skillUsed || f.projectHasFormat || f.personSetReply) return null   // the person's and the project's own words win
  if (f.backgroundTasks > 0) return null                          // pausing for background work, not finishing
  if (f.editedLines <= TRIVIAL_LINES) return null                 // no code changed, or a trivial edit
  if (confidenceOf(f.lastMessage) !== null) return null           // the report's confidence is there
  if (asksPerson(f.lastMessage) && !hasReport(f.lastMessage)) return null   // a question before the work is done
  return REPORT_NUDGE
}

/** Lines an edit tool call writes, from its input; 0 for anything else. */
export const editedLines = (tool: string, input: Record<string, unknown>): number => {
  const lines = (v: unknown) => (typeof v === 'string' && v !== '' ? v.split('\n').length : 0)
  if (tool === 'Write') return lines(input.content)
  if (tool === 'Edit') return lines(input.new_string)
  if (tool === 'NotebookEdit') return lines(input.new_source)
  if (tool === 'MultiEdit' && Array.isArray(input.edits)) {
    return input.edits.reduce((n: number, ed: unknown) => n + lines((ed as { new_string?: unknown }).new_string), 0)
  }
  return 0
}

// A project rule about how to report: a named format for the final message or report.
const OWN_FORMAT = [
  /\b(?:final|closing|last)\s+(?:message|answer|reply|report|summary|response)\b/i,
  /\b(?:report|reply|answer|response|summary|handoff|hand-off)\s+(?:format|style|structure|template|sections?|headings?|layout)\b/i,
  /\b(?:format|structure)\s+(?:of|for)\s+(?:the|your|each|every)?\s*(?:report|reply|answer|response|summary)\b/i,
  /\bend\s+(?:each|every|your)\s+(?:task|turn|reply|answer|response)\s+with\b/i,
]

/** Whether a project rules file sets its own report or reply format. */
export const setsOwnFormat = (rules: string): boolean => OWN_FORMAT.some(r => r.test(rules))

/** The project rules files to read from a folder: each one that can set the format. */
export const RULE_FILES = ['CLAUDE.md', 'AGENTS.md', '.claude/CLAUDE.md', 'CLAUDE.local.md']

/** The folders whose rules apply to a working directory: it and each parent, up to the home folder. */
export const ruleFolders = (cwd: string, home: string): string[] => {
  const out: string[] = []
  let dir = cwd.replace(/\/+$/, '')
  while (dir !== '' && dir !== home && dir.startsWith('/')) {
    out.push(dir)
    const up = dir.slice(0, dir.lastIndexOf('/'))
    if (up === dir) break
    dir = up
  }
  return out
}

// The person asking for a reply of another kind: short, one line, no report, a set format.
const PERSON_REPLY = /\b(?:no\s+(?:report|summary|explanation)|one[\s-](?:line|sentence|word)|in\s+(?:one|a\s+single)\s+(?:line|sentence|word)|(?:reply|answer|respond)\s+(?:with|in)\s+(?:only|just)|just\s+(?:say|tell\s+me|reply|answer)|keep\s+it\s+(?:short|brief)|brief(?:ly)?|short\s+(?:reply|answer)|tl;?dr|only\s+(?:the\s+)?(?:code|diff|answer))\b/i

/** Whether the person's message asks for a different kind of reply than the skill's report. */
export const asksOwnReply = (message: string): boolean => PERSON_REPLY.test(message)

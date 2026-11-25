/**
 * The progress tracker's rules: which of the skill's five moments a run is in,
 * read from what plugins can see (tool calls, and each turn's final answer).
 * Pure, so the rules are tested without the engine.
 */
import type { Confidence, Run, Size } from '../types'

export const PHASES = ['Understand', 'Design', 'Build', 'Verify', 'Report'] as const

export const startRun = (): Run =>
  ({ current: 0, reached: 0, checks: 0, failed: 0, confidence: null, isDone: false })

/** Moves to `phase`; the current one may go back (a fix after Verify), what was reached never does. */
const moveTo = (run: Run, phase: number): Run =>
  ({ ...run, current: phase, reached: Math.max(run.reached, phase) })

const EDIT_TOOLS = new Set(['Edit', 'Write', 'MultiEdit', 'NotebookEdit'])
const CHECK = /\b(test|tests|tsc|lint|eslint|ruff|mypy|pytest|jest|vitest|validate|check-diff|cargo (test|check|clippy)|go (test|vet)|build)\b/

/** Whether a shell command is a check: tests, a type check, lint, validate, check-diff or a build. */
export const isCheckCommand = (command: string): boolean => CHECK.test(command)

/** A finished tool call: edits mean Build, check commands mean Verify. */
export const onTool = (run: Run, tool: string, command: string | undefined, isError: boolean): Run => {
  if (EDIT_TOOLS.has(tool)) return moveTo(run, 2)
  if (tool === 'Bash' && command !== undefined && isCheckCommand(command)) {
    return { ...moveTo(run, 3), checks: run.checks + 1, failed: run.failed + (isError ? 1 : 0) }
  }
  return run
}

export const CARD_TOOL = 'mcp__agent-skill-ultimate-coding__design_card'
const SIZES: readonly Size[] = ['Trivial', 'Small', 'Normal', 'Complex']

/** A recorded design card: the run reaches Design and takes the card's size. */
export const onCard = (run: Run, size: unknown): Run => {
  const moved = run.current < 1 ? moveTo(run, 1) : { ...run, reached: Math.max(run.reached, 1) }
  return SIZES.includes(size as Size) ? { ...moved, size: size as Size } : moved
}

const REPORT = /###\s*1\.\s*What was done/
const CONFIDENCE = /Confidence:\s*(High|Medium|Low)/
const WAITING = /###\s*3\.\s*Waiting for you/

/**
 * A turn's final answer: the report moves the run to Report and sets its
 * confidence; the run pauses when the turn ends waiting for the user (a
 * "Waiting for you" part, or no report yet) and finishes otherwise.
 */
export const onAnswer = (run: Run, answer: string): Run => {
  let next: Run = { ...run, isDone: true }
  if (hasReport(answer)) next = moveTo(next, 4)
  const c = CONFIDENCE.exec(answer)
  if (c) next = { ...next, confidence: c[1] as Confidence }
  return { ...next, isPaused: !isFinishedAnswer(answer) }
}

/**
 * Whether an answer holds a report: the three-part heading, or the confidence
 * line every report form ends with (Claude sometimes writes a plain summary
 * with its confidence line and no headings).
 */
const hasReport = (answer: string): boolean => REPORT.test(answer) || CONFIDENCE.test(answer)

/** Whether a turn's final answer finishes its task: a report with no "Waiting for you" part. */
export const isFinishedAnswer = (answer: string): boolean => hasReport(answer) && !WAITING.test(answer)

/** On the user's next message: a finished run is cleared, a paused one carries on. */
export const onPrompt = (run: Run | null): Run | null =>
  run === null || !run.isPaused ? null : { ...run, isDone: false, isPaused: false }

/** The spinner word for the current moment. */
export const spinnerWord = (run: Run): string =>
  ['Understanding', 'Designing', 'Building', 'Verifying', 'Reporting'][run.current] ?? 'Working'

/** The end-of-turn past tense: the furthest moment reached. */
export const doneWord = (run: Run): string =>
  ['Understood', 'Designed', 'Built', 'Verified', 'Reported'][run.reached] ?? 'Worked'

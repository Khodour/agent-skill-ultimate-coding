/**
 * The scorecard's counting rules: what the session's skill work came to.
 * Pure, so the rules are tested without the engine.
 */
import type { Run, Score } from '../types'
import { isCheckCommand } from './progress'

export const emptyScore = (): Score => ({
  tasks: { Trivial: 0, Small: 0, Normal: 0, Complex: 0, Unsized: 0 },
  confidence: { High: 0, Medium: 0, Low: 0 },
  edits: 0,
  checks: 0,
  checksFailed: 0,
  cards: 0,
})

const EDIT_TOOLS = new Set(['Edit', 'Write', 'MultiEdit', 'NotebookEdit'])

/** Counts one finished tool call of the main loop. */
export const countTool = (s: Score, tool: string, command: string | undefined, isError: boolean, isCard: boolean): Score => {
  if (isCard) return isError ? s : { ...s, cards: s.cards + 1 }
  if (EDIT_TOOLS.has(tool) && !isError) return { ...s, edits: s.edits + 1 }
  if (tool === 'Bash' && command !== undefined && isCheckCommand(command)) {
    return { ...s, checks: s.checks + 1, checksFailed: s.checksFailed + (isError ? 1 : 0) }
  }
  return s
}

/** Counts a task at the turn that finishes it: one that answered with a report giving its confidence. */
export const countFinish = (s: Score, before: Run | null, after: Run | null): Score => {
  if (before === null || after === null || !after.isDone || after.stop !== undefined || after.confidence === null) return s
  const size = after.size ?? 'Unsized'
  const confidence = after.confidence === null
    ? s.confidence
    : { ...s.confidence, [after.confidence]: s.confidence[after.confidence] + 1 }
  return { ...s, tasks: { ...s.tasks, [size]: s.tasks[size] + 1 }, confidence }
}

/** A bar of blocks for a count, at most `width` long; one thin mark for zero. */
export const bar = (n: number, width = 16): string => (n <= 0 ? '▏' : '█'.repeat(Math.min(n, width)))

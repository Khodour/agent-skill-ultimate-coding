/**
 * The run tracker's rules. A run holds only what Claude Code's own events make
 * certain: a turn is working, a subagent is working, the turn was stopped (Esc,
 * an error) or it ended, with the checks run and the report's confidence. It
 * never guesses which step of the skill Claude is on. Pure, so the rules are
 * tested without the engine.
 */
import type { Confidence, PromptKind, Run, Size } from '../types'
import { CHECKLIST_TOOL } from './checklist'

/** A new run; a tentative one is dropped if its turn turns out to be only a question. */
export const startRun = (isTentative = false): Run =>
  ({ checks: 0, failed: 0, confidence: null, isDone: false, ...(isTentative ? { isTentative: true } : {}) })

/** Real work (a checklist item, an edit, a hand-off) makes a tentative run a task. */
const real = (run: Run): Run => {
  const { isTentative: _, ...rest } = run
  return rest
}

const EDIT_TOOLS = new Set(['Edit', 'Write', 'MultiEdit', 'NotebookEdit'])

// A check is recognised by the program a command part starts with, never by a word
// anywhere in it: "test -f a.py", "ls tests/" and "which tsc" only look, they check nothing.
// Programs may carry a path, in quotes or not ("$S/venv/bin/python", "./node_modules/.bin/jest", "/bin/bash").
// "<anything> -m <checker>" covers interpreters named by a variable, such as "$PY" -m pytest.
const AT = String.raw`["']?(?:[^\s"']*\/)?`
const RUNNER = String.raw`(?:(?:npx|bunx|pnpm\s+exec|pnpm|yarn|npm(?:\s+run)?|bun(?:\s+run)?|["']?[^\s"']+["']?\s+-m|uv\s+run|poetry\s+run|bundle\s+exec)\s+)`
const CHECKER = String.raw`${AT}(?:pytest|jest|vitest|mocha|tsc|eslint|biome|ruff|mypy|pyright|flake8|pylint|rspec|phpunit|phpstan|psalm|rubocop|unittest|tox|swiftlint|ktlint|detekt|xcodebuild|shellcheck)`
const SCRIPT = String.raw`(?:test|tests|lint|build|typecheck|type-check|check|ci|verify|validate)[\w:-]*`
const COMPOUND = String.raw`(?:go\s+(?:test|vet|build)|cargo\s+(?:test|check|clippy|build)|swift\s+(?:test|build)|dotnet\s+(?:test|build)|mix\s+(?:test|compile)|rake\s+(?:test|spec)|make\s+${SCRIPT}|\.?\/?gradlew?\s+(?:\S+\s+)*?\S*(?:[Tt]est|[Bb]uild|assemble|lint|check)\S*|mvn\s+(?:\S+\s+)*?(?:test|verify|package)|claude\s+plugin\s+(?:test|validate)|php\s+artisan\s+test|${AT}(?:bash|sh)\s+["']?[^"']*(?:check-diff\.sh|tests?\/[^"'\s]*\.sh))`
const CHECK_PART = new RegExp(String.raw`^(?:\w+=\S*\s+)*(?:${RUNNER}?${CHECKER}|${RUNNER}${SCRIPT}|${COMPOUND})(?=\s|$|["'])`)

/** Whether a shell command runs a check: tests, a type check, lint, a build, validate or check-diff. */
export const isCheckCommand = (command: string): boolean =>
  command.split(/&&|\|\||;|\||\n/).some(part => {
    const p = part.trim().replace(/^\(+\s*/, '').replace(/^(?:time|timeout\s+\S+)\s+/, '')
    return CHECK_PART.test(p) && !/\s--?(?:version|V|help|h)(?:\s|$)/.test(p)   // a version or help probe checks nothing
  })

/** The tools that hand work to a subagent. */
const AGENT_TOOLS = new Set(['Agent', 'Task'])

/** The agent's own task-list tools: an item written there is a step of the task. */
const CHECKLIST_TOOLS = new Set(['TaskCreate', 'TodoWrite', CHECKLIST_TOOL])

/** Whether a finished tool call is real work on a task: a checklist item, an edit, a check, or work handed to a subagent. */
export const isTaskWork = (tool: string, command: string | undefined): boolean =>
  CHECKLIST_TOOLS.has(tool) || EDIT_TOOLS.has(tool) || AGENT_TOOLS.has(tool) ||
  (tool === 'Bash' && command !== undefined && isCheckCommand(command))

/** A subagent's loop started or ended: the run counts it as busy while it works. */
export const onAgent = (run: Run, agentId: string, isRunning: boolean): Run => {
  const others = (run.agents ?? []).filter(a => a !== agentId)
  const agents = isRunning ? [...others, agentId] : others
  const { agents: _, ...rest } = run
  return agents.length > 0 ? { ...rest, agents } : rest
}

/** Whether subagents are working for the run right now. */
export const hasAgents = (run: Run): boolean => (run.agents?.length ?? 0) > 0

/**
 * A finished tool call. A checklist item, an edit or work handed to a subagent makes the run a task;
 * a check is counted (passed or failed) but only looks, so on its own it never
 * turns a question's turn into a task.
 */
export const onTool = (run: Run, tool: string, command: string | undefined, isError: boolean): Run => {
  if (CHECKLIST_TOOLS.has(tool) || EDIT_TOOLS.has(tool) || AGENT_TOOLS.has(tool)) return real(run)
  if (tool === 'Bash' && command !== undefined && isCheckCommand(command)) {
    return { ...run, checks: run.checks + 1, failed: run.failed + (isError ? 1 : 0) }
  }
  return run
}

const SIZES: readonly Size[] = ['Trivial', 'Small', 'Normal', 'Complex']

/** Claude named the task's size: the run is a task, with that size. */
export const onSize = (run: Run, size: unknown): Run =>
  SIZES.includes(size as Size) ? { ...real(run), size: size as Size } : real(run)

// A line that names the size: "Size: Normal", "**Size** Complex", "Checklist (Small)", "Checklist · Normal".
const SIZE_LINE = /(?:^|\n)[ \t>*#_|\x60-]*(?:Size|Checklist)\b[^\n]*?\b(Trivial|Small|Normal|Complex)\b/i

/**
 * The size Claude names for the task in a reply, or null when the text names none.
 * It is the size Claude chose: no rule here guesses it from the task's words.
 */
export const sizeInText = (text: string): Size | null => {
  const word = SIZE_LINE.exec(text)?.[1]
  return SIZES.find(z => z.toLowerCase() === word?.toLowerCase()) ?? null
}

// The report's confidence, in the skill's own words ("I have medium confidence in this change"),
// or the older label ("Confidence: Medium"), so reports written before the change still read.
const CONFIDENCE_SAID = /\bI have (high|medium|low) confidence\b/i
const CONFIDENCE_LABEL = /Confidence:?\**\s*(High|Medium|Low)\b/

/** The confidence an answer gives, or null when it gives none. */
export const confidenceOf = (answer: string): Confidence | null => {
  const word = (CONFIDENCE_SAID.exec(answer) ?? CONFIDENCE_LABEL.exec(answer))?.[1]
  if (word === undefined) return null
  return (word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) as Confidence
}
// A report in any of the shapes Claude writes it: the confidence line every report ends with,
// or the older three-part headings (numbered or bold).
const REPORT = /(?:^|\n)\s*(?:#{1,4}\s*(?:\d\.\s*)?|\*\*)(?:What was done|Needs attention|Waiting for you)\b/i
const WAITING = /(?:^|\n)\s*(?:#{1,4}\s*(?:\d\.\s*)?|\*\*)Waiting for you\b/i

/** How a turn ended, as `turn.complete`'s `reason` gives it. */
export type TurnEnd = 'answer' | 'aborted' | 'error' | 'refusal'

/** A `turn.complete` reason as a TurnEnd: anything but a known stop (a new or missing reason) counts as an answer. */
export const turnEnd = (reason: unknown): TurnEnd =>
  reason === 'aborted' || reason === 'error' || reason === 'refusal' ? reason : 'answer'

/** Whether an answer holds a report: its headings in any shape, or its confidence line. */
export const hasReport = (answer: string): boolean => REPORT.test(answer) || confidenceOf(answer) !== null

/** Whether a turn's final answer finishes its task: it holds a report. */
export const isFinishedAnswer = (answer: string): boolean => hasReport(answer)

/**
 * Whether the answer hands a question to the person: a "Waiting for you" part, or a
 * question in its last paragraph ("Should I commit? If yes, I'll ..."). The report
 * check uses it: a question before the work is done is not a missing report.
 */
export const asksPerson = (answer: string): boolean => {
  if (WAITING.test(answer)) return true
  const last = answer.trim().split(/\n\s*\n/).pop() ?? ''
  return /\?(?:[*_`)\s]|$)/.test(last)
}

/**
 * A turn ended. Stopped by Esc, an API error or a refusal: marked so. Answered:
 * done, and the report's confidence is kept when it gives one. A tentative run whose turn did no task work
 * and gave no report is dropped: that turn was only a question. Returns null then.
 */
export const onAnswer = (run: Run, answer: string, end: TurnEnd = 'answer'): Run | null => {
  if (run.isTentative === true && end === 'answer' && !hasReport(answer)) return null
  const { stop: _, ...rest } = run
  if (end !== 'answer') return { ...rest, isDone: true, stop: end }
  const c = confidenceOf(answer)
  return { ...rest, isDone: true, ...(c !== null ? { confidence: c } : {}) }
}

/** A turn of the main loop started while a run is open (a background task's notice): it is working again. */
export const onTurnStart = (run: Run | null): Run | null => {
  if (run === null) return null
  const { stop: _, ...rest } = run
  return { ...rest, isDone: false }
}

// Origins that are the person speaking: a new message starts a fresh run.
const PERSON = new Set(['composer', 'bridge', 'sdk', 'scheduled-trigger', 'channel', 'coordinator', 'projects-relay', 'slack-ping'])

/**
 * What a submitted prompt means for the run. A slash command or a hidden engine
 * prompt changes nothing; a prompt delivered into the running turn, or one from a
 * background task, a peer session, an observer or an unknown source, is part of
 * the same work; only the person's own message, sent while idle, is new.
 */
export const classifyPrompt = (e: { command?: unknown; isMeta?: boolean; turnId?: string; origin?: { kind?: string; asUser?: boolean } }): PromptKind => {
  if (e.command !== undefined || e.isMeta === true) return 'none'
  if (e.turnId !== undefined) return 'same'
  const kind = e.origin?.kind
  if (kind === undefined) return 'new'           // an engine too old to say where a prompt came from: the person typed it
  if (PERSON.has(kind)) return 'new'
  if (kind === 'plugin' && e.origin?.asUser === true) return 'new'
  return 'same'
}

/**
 * On a submitted prompt. The person's new message, once nothing is working, closes
 * the run: the next turn starts fresh, so nothing from an earlier turn is counted
 * twice. Anything else, or a run still busy (a turn or a subagent working), stays.
 */
export const onPrompt = (run: Run | null, kind: PromptKind = 'new'): Run | null =>
  run === null || kind !== 'new' || !run.isDone || hasAgents(run) ? run : null

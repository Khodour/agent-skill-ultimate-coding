/**
 * The session values the hooks module keeps, for the progress tracker.
 */

/** How sure the report says it is. */
export type Confidence = 'High' | 'Medium' | 'Low'

/** A task's size, as the design card gives it. */
export type Size = 'Trivial' | 'Small' | 'Normal' | 'Complex'

/** One skill run: where it is among the five moments and what its checks came to. */
export type Run = {
  /** Index into the five moments of the latest activity. */
  current: number
  /** The furthest moment reached; earlier ones show as done. */
  reached: number
  checks: number
  failed: number
  confidence: Confidence | null
  /** The turn ended. */
  isDone: boolean
  /** The turn ended waiting for the user's answer: their reply continues this run. */
  isPaused?: boolean
  /** The size the design card gave the task; absent until a card is recorded. */
  size?: Size
}

/** The session's running totals, for the scorecard panel. */
export type Score = {
  tasks: { Trivial: number; Small: number; Normal: number; Complex: number; Unsized: number }
  confidence: { High: number; Medium: number; Low: number }
  edits: number
  checks: number
  checksFailed: number
  cards: number
}

/** One danger check-diff found in an edit's added lines. */
export type Finding = { line: number; rule: string; message: string }

/** What check-diff said about one edit. */
export type CheckResult =
  | { status: 'checking' }
  | { status: 'clean' }
  | { status: 'found'; findings: Finding[] }
  | { status: 'error'; message: string }

/** A Complex area an edit can touch; each needs its own line on the design card. */
export type Area = 'money' | 'access' | 'privacy' | 'migration' | 'race' | 'compat'

/** The language the card box is drawn in, from the user's own messages. */
export type Lang = 'en' | 'ar'

/** The design card as the design_card tool records it: field name to text. */
export type Card = { size: Size } & Record<string, string>

/** The gate's memory for the current task: whether a card exists, the areas it covers, and those last asked for. */
export type GateState = { hasCard: boolean; covered: Area[]; pending: Area[] }

declare module 'claude-code' {
  interface PluginState {
    'agent-skill-ultimate-coding': {
      run: Run | null
      blink: boolean
      score: Score
      /** check-diff's verdict per edit, by tool call id; the newest 100. */
      checkdiff: Record<string, CheckResult>
      gate: GateState
      /** Recorded cards by tool call id, for the box under each design_card row; the newest 50. */
      cards: Record<string, { card: Card; lang: Lang }>
      lang: Lang
    }
  }
}

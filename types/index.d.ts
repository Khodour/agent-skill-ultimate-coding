/**
 * The session values the hooks module keeps, for the progress tracker.
 */

/** How sure the report says it is. */
export type Confidence = 'High' | 'Medium' | 'Low'

/** A task's size, as the design card gives it. */
export type Size = 'Trivial' | 'Small' | 'Normal' | 'Complex'

/** One run of skill work, from the person's message until their next one: its checks and how its turn ended. */
export type Run = {
  checks: number
  failed: number
  /** The report's confidence, when the answer gave one. */
  confidence: Confidence | null
  /** The turn ended. */
  isDone: boolean
  /** The turn ended with an answer that asks the person something. */
  asks?: boolean
  /** The size the design card gave the task; absent until a card is recorded. */
  size?: Size
  /**
   * Opened only because a turn started after the skill was used: shown at once, and
   * dropped if the turn ends with no task work and no report (it was just a question).
   */
  isTentative?: boolean
  /** How the last turn ended when it did not end with an answer: Esc, an API error, a refusal. */
  stop?: 'aborted' | 'error' | 'refusal'
  /** Subagents working for this run right now (their loop ids): the run is busy even when the main turn ended. */
  agents?: string[]
}

/** What a submitted prompt means for the run: a new message from the person, part of the same task, or nothing. */
export type PromptKind = 'new' | 'same' | 'none'

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
      /** The skill was loaded in this session: later tasks open a run at their first real step. */
      skillUsed: boolean
      /** Lines written by edits since the person's last message, for the report check. */
      reportLines: number
      /** The person's latest message asked for a reply of their own kind (one line, no report). */
      personSetReply: boolean
      /** Whether each working directory's own rules set a report format, read once per directory. */
      projectFormats: Record<string, boolean>
      /** The blink clock: which half of the blink, and when it last turned (a stale one means the timer died). */
      pulse: { on: boolean; at: number }
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

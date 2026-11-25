/**
 * Feature: the progress tracker. A bar above the prompt shows the skill run's
 * five moments, the task size and the checks; the spinner word names the
 * current moment; the end-of-turn line names the furthest one reached.
 */
import { atom, read, update } from 'claude-code'
import type { EngineInterface, On } from 'claude-code'

import type { Run } from '../types'
import { CARD_TOOL, PHASES, doneWord, onAnswer, onCard, onPrompt, onTool, spinnerWord, startRun } from './progress'

const run = atom({ plugin: 'agent-skill-ultimate-coding', key: 'run' } as const, null)
const blink = atom({ plugin: 'agent-skill-ultimate-coding', key: 'blink' } as const, false)

/** One quiet colour per size, so the badge reads at a glance. */
export const SIZE_COLOR = { Trivial: '#9ca3af', Small: '#67e8f9', Normal: '#93c5fd', Complex: '#f0abfc' } as const
/** Confidence as a small one-cell dot, coloured. */
export const CONF_COLOR = { High: '#4ade80', Medium: '#fbbf24', Low: '#f87171' } as const

/** Applies `fn` to the run, if one is active. */
function change($: EngineInterface, fn: (r: Run) => Run) {
  return update($, run, r => (r === null ? r : fn(r)))
}

/** Session start: the blink clock. A timer started inside one hook stops when that hook returns, so it lives here. */
export function trackerStart($: EngineInterface): void {
  $.clock.every(500, () => {
    void read($, run).then(r => {
      if (r !== null && !r.isDone) void update($, blink, b => !b)
    })
  })
}

/** A new message clears a finished run; a paused one (it asked the user) carries on. */
export function trackerPrompt($: EngineInterface) {
  return update($, run, r => onPrompt(r))
}

/** The skill is in use this turn: start a run, or carry on the open one. */
export function trackerSkill($: EngineInterface) {
  return update($, run, r => r ?? startRun())
}

/** A finished tool call of the main loop. */
export async function trackerTool($: EngineInterface, tool: string, input: unknown, ran: { deny?: string; isError?: boolean }) {
  if (ran.deny !== undefined) return
  if (tool === CARD_TOOL) {
    if (ran.isError !== true) await change($, r => onCard(r, (input as { size?: unknown }).size))
    return
  }
  const command = tool === 'Bash' ? (input as { command?: unknown }).command : undefined
  await change($, r => onTool(r, tool, typeof command === 'string' ? command : undefined, ran.isError === true))
}

/** The turn's final answer: report, confidence, paused or finished. Returns the run before and after, for the scorecard. */
export async function trackerTurnEnd($: EngineInterface, answer: string): Promise<{ before: Run | null; after: Run | null }> {
  const before = await read($, run)
  const after = before === null ? null : onAnswer(before, answer)
  await update($, run, () => after)
  return { before, after }
}

/** Adds the tracker's drawing hooks; each has its own component matcher, so none clashes with another feature. */
export const registerTrackerViews = (on: On): void => {
  // The bar above the prompt.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const r = await read($, run)
    if (e.props.hasSurvey || r === null) return next(e)
    const { Box, Text } = $.ui.resolve(e)
    const isLit = await read($, blink)
    return (
      <Box>
        <Text color="#4ade80">Ultimate Coding </Text>
        {r.size !== undefined && (
          <Text>
            <Text color={SIZE_COLOR[r.size]} bold>{r.size}</Text>
            <Text dimColor>{'  '}</Text>
          </Text>
        )}
        {PHASES.map((name, i) => {
          const isCurrent = !r.isDone && i === r.current
          const isDone = i < r.reached || (r.isDone && i <= r.reached) || (i <= r.reached && i !== r.current)
          return (
            <Text>
              {i > 0 && <Text dimColor> › </Text>}
              {isCurrent
                ? <Text color="#fbbf24">{isLit ? '◉' : '○'} {name}</Text>
                : isDone
                  ? <Text color="#4ade80">✓ {name}</Text>
                  : <Text dimColor>○ {name}</Text>}
            </Text>
          )
        })}
        {r.checks > 0 && <Text dimColor>{`  · checks ${r.checks - r.failed}/${r.checks}`}</Text>}
        {r.confidence !== null && (
          <Text>
            <Text dimColor>{'  · '}</Text>
            <Text color={CONF_COLOR[r.confidence]}>● {r.confidence}</Text>
          </Text>
        )}
      </Box>
    )
  })

  // The spinner word names the current moment.
  on('ui.render', { component: 'Spinner' }, async ($, e, next) => {
    const r = await read($, run)
    if (r === null || r.isDone) return next(e)
    return next({ ...e, props: { ...e.props, word: spinnerWord(r) } })
  })

  // The end-of-turn line names the furthest moment reached.
  on('ui.render', { component: 'TurnDuration' }, async ($, e, next) => {
    const r = await read($, run)
    if (r === null) return next(e)
    return next({ ...e, props: { ...e.props, word: doneWord(r) } })
  })
}

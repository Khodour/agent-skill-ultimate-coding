/**
 * Feature: the session scorecard. /uc-score opens a panel that sums up the
 * session's skill work: tasks by size, confidence, cards, edits and checks.
 */
import { atom, read, update } from 'claude-code'
import type { EngineInterface, On } from 'claude-code'

import type { Run, Score } from '../types'
import { checkdiffCounts } from './checkdiff'
import { CARD_TOOL } from './progress'
import { bar, countFinish, countTool, emptyScore } from './score'
import { CONF_COLOR, SIZE_COLOR } from './tracker'

const score = atom({ plugin: 'agent-skill-ultimate-coding', key: 'score' } as const, emptyScore())
const PANE = 'uc-score'

/** Session start: the /uc-score command. */
export async function scorecardStart($: EngineInterface): Promise<void> {
  await $.command.register({ name: 'uc-score', description: 'Open the Ultimate Coding session scorecard' })
}

/** A finished tool call of the main loop. */
export async function scorecardTool($: EngineInterface, tool: string, input: unknown, ran: { deny?: string; isError?: boolean }) {
  if (ran.deny !== undefined) return
  const command = tool === 'Bash' ? (input as { command?: unknown }).command : undefined
  await update($, score, s => countTool(s, tool, typeof command === 'string' ? command : undefined, ran.isError === true, tool === CARD_TOOL))
}

/** A turn ended: count the task if this turn finished it. */
export async function scorecardTurnEnd($: EngineInterface, before: Run | null, after: Run | null) {
  await update($, score, s => countFinish(s, before, after))
}

/** Adds the command's answer and the panel's drawing; each has its own matcher. */
export const registerScorecardViews = (on: On): void => {
  on('command.run', { command: 'uc-score' }, async $ => {
    await $.ui.open({ id: PANE, title: 'Ultimate Coding · session' })
    return { text: 'Scorecard opened.' }
  })

  on('ui.render', { component: 'Pane', requestId: 'uc-score' }, async ($, e) => {
    const { Box, Text } = $.ui.resolve(e)
    const s: Score = await read($, score)
    const diff = await checkdiffCounts($)
    const total = Object.values(s.tasks).reduce((a, b) => a + b, 0)
    const sizes = (['Trivial', 'Small', 'Normal', 'Complex', 'Unsized'] as const).filter(k => s.tasks[k] > 0)
    return (
      <Box flexDirection="column">
        <Text bold>Tasks finished  {total}</Text>
        {total === 0 && <Text dimColor>  none yet: a task counts once its report has no questions</Text>}
        {sizes.map(k => {
          const color = k === 'Unsized' ? '#9ca3af' : SIZE_COLOR[k]
          return (
            <Text>
              <Text color={color}>{`  ${(k === 'Unsized' ? 'No card' : k).padEnd(9)}`}{bar(s.tasks[k])}</Text>
              <Text dimColor>{` ${s.tasks[k]}`}</Text>
            </Text>
          )
        })}
        <Text> </Text>
        <Text bold>Confidence</Text>
        {(['High', 'Medium', 'Low'] as const).map(k => (
          <Text>
            <Text color={CONF_COLOR[k]}>{`  ● ${k.padEnd(7)}`}{bar(s.confidence[k])}</Text>
            <Text dimColor>{` ${s.confidence[k]}`}</Text>
          </Text>
        ))}
        <Text> </Text>
        <Text bold>Work</Text>
        <Text>{`  Cards      ${s.cards}`}</Text>
        <Text>{`  Edits      ${s.edits}`}</Text>
        <Text>
          {`  Checks     ${s.checks - s.checksFailed} passed`}
          {s.checksFailed > 0 && <Text color="#f87171">{` · ${s.checksFailed} failed`}</Text>}
        </Text>
        <Text>
          {'  check-diff '}
          <Text color="#4ade80">{`${diff.clean} clean`}</Text>
          {diff.found > 0 && <Text color="#f87171">{` · ${diff.found} with dangers`}</Text>}
        </Text>
      </Box>
    )
  })
}

/**
 * Feature: the checklist on screen. Above the prompt, while Claude works, a
 * header with the task's size and a three-colour meter (done, being worked on,
 * left), then the items: done ones ticked and struck through, the one being
 * worked on with a turning mark, open ones as empty boxes, and a grey line on how
 * to switch it off in /config. When the turn ends it
 * folds into one line until the person's next message. In the chat, the tool's
 * own row is one short line. It only draws; it never blocks anything.
 */
import { atom, read, update } from 'claude-code'
import type { ElementTable, EngineInterface, On } from 'claude-code'

import { checklistToolRow, countOf, formatElapsed, itemElapsed, listElapsed, meterCells, visibleItems } from './checklist'
import { trackerList } from './tracker'

const spin = atom({ plugin: 'agent-skill-ultimate-coding', key: 'spin' } as const, 0)
/** The turning mark on the item being worked on, one frame every SPIN_MS. */
const FRAMES = ['◐', '◓', '◑', '◒'] as const
const SPIN_MS = 150

/** One colour per size, so the header reads at a glance. */
const SIZE_COLOR = { Trivial: '#9ca3af', Small: '#67e8f9', Normal: '#93c5fd', Complex: '#f0abfc' } as const
const DONE = '#4ade80'
const DOING = '#fbbf24'
const LEFT = '#4b5563'

/** The item's words, cut to fit. */
const short = (s: string, max: number): string => (s.length <= max ? s : `${s.slice(0, max - 1)}…`)

/**
 * Session start: the spinner's clock. It writes only while Claude works on the list (an item being
 * worked on, or the timer running between items), so a finished or idle list costs nothing.
 */
export function checklistViewStart($: EngineInterface, timer = true): void {
  $.clock.every(SPIN_MS, () => {
    void (async () => {
      const t = await trackerList($)
      const items = t?.list?.items ?? []
      const working = items.some(i => i.status === 'doing') || (timer && items.length > 0 && items.some(i => i.status !== 'done'))
      if (t !== null && !t.isDone && working) await update($, spin, f => (f + 1) % FRAMES.length)
    })()
  })
}

/** The checklist tool's own row in the chat: one dim line, as the list is above the prompt. */
export async function checklistRow($: EngineInterface, input: unknown, ui: Pick<ElementTable, 'Text'>) {
  const { Text } = ui
  const t = await trackerList($)
  return <Text dimColor>{checklistToolRow(input, t?.list)}</Text>
}

/** Adds the drawing hook: the checklist above the prompt; `timer` adds the work times. */
export const registerChecklistView = (on: On, timer = true): void => {
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const t = await trackerList($)
    const list = t?.list
    if (e.props.hasSurvey || t === null || list === undefined || list.items.length === 0) return next(e)
    const { Box, Text } = $.ui.resolve(e)
    const c = countOf(list)
    const now = Date.now()
    const total = timer ? listElapsed(list, now, !t.isDone) : undefined
    const timeOf = (i: (typeof list.items)[number]) => {
      const ms = timer ? itemElapsed(i, now) : undefined
      return ms === undefined ? '' : `  ${formatElapsed(ms)}`
    }
    const wide = (e.props.bodyColumns ?? 120) >= 100
    const sizeColor = list.size === undefined ? '#9ca3af' : SIZE_COLOR[list.size]
    const title = (
      <Text>
        <Text color={sizeColor} bold>{'◆ Checklist'}</Text>
        {list.size !== undefined && <Text color={sizeColor}>{` · ${list.size}`}</Text>}
      </Text>
    )

    if (t.isDone) {
      // The turn ended: one line until the person's next message.
      const allDone = c.done === c.total
      const firstOpen = list.items.find(i => i.status !== 'done')
      return (
        <Box>
          {title}
          <Text color={allDone ? DONE : DOING} bold>{allDone ? `  ✔ all ${c.total} done` : `  ${c.done}/${c.total} done`}</Text>
          {!allDone && firstOpen !== undefined && <Text dimColor>{` · open: ${short(firstOpen.text, 50)}`}</Text>}
          {total !== undefined && <Text dimColor>{` · ⏱ ${formatElapsed(total)}`}</Text>}
        </Box>
      )
    }

    const m = meterCells(list, wide ? 24 : 12)
    const frame = FRAMES[(await read($, spin)) % FRAMES.length] ?? '◐'
    const rows = visibleItems(list, Math.max((e.props.maxRows ?? 10) - 2, 1))   // the header and the hint take a row each
    const width = wide ? 80 : 44
    return (
      <Box flexDirection="column">
        <Text>
          {title}
          <Text>{'  '}</Text>
          <Text color={DONE}>{'━'.repeat(m.done)}</Text>
          <Text color={DOING}>{'━'.repeat(m.doing)}</Text>
          <Text color={LEFT}>{'━'.repeat(m.left)}</Text>
          <Text bold>{`  ${c.done}/${c.total}`}</Text>
          {rows.length < c.total && <Text dimColor>{`  (${rows[0]?.n}–${rows[rows.length - 1]?.n})`}</Text>}
          {total !== undefined && <Text dimColor>{`  ⏱ ${formatElapsed(total)}`}</Text>}
        </Text>
        {rows.map(i => (
          i.status === 'done'
            ? <Text><Text color={DONE}>{'  ✔ '}</Text><Text dimColor strikethrough>{short(i.text, width)}</Text><Text dimColor>{timeOf(i)}</Text></Text>
            : i.status === 'doing'
              ? <Text><Text color={DOING} bold>{`  ${frame} `}</Text><Text color={DOING} bold>{short(i.text, width)}</Text><Text color={DOING}>{timeOf(i)}</Text></Text>
              : <Text><Text color="#9ca3af">{'  □ '}</Text><Text>{short(i.text, width)}</Text></Text>
        ))}
        <Text dimColor>{'  Turn it off any time in /config › Checklist above the input · recommended: keep it on'}</Text>
      </Box>
    )
  })
}

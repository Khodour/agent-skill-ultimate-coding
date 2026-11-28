import { expect, test } from 'claude-code/testing'
import type { Checklist } from '../types'
import { applyChecklist, checklistReply, checklistToolRow, countOf, formatElapsed, itemElapsed, listElapsed, meterCells, visibleItems } from './checklist'

const T0 = 1_000_000
const write = (items: string[], size = 'Normal'): Checklist => applyChecklist(undefined, { size, items }, T0)

test('the tool writes the list with its size, marks the item being worked on, and ticks items', async () => {
  let l = write(['Build on as_price()', 'receipt_line', 'Edges: 0, negative', 'Proof: tests'])
  expect([l.size, countOf(l)]).toEqual(['Normal', { done: 0, doing: 0, open: 4, total: 4 }])
  l = applyChecklist(l, { doing: 1 })
  expect(l.items.map(i => i.status)).toEqual(['doing', 'open', 'open', 'open'])
  l = applyChecklist(l, { done: [1], doing: 2 })
  expect(l.items.map(i => i.status)).toEqual(['done', 'doing', 'open', 'open'])
  l = applyChecklist(l, { doing: 3 })                                          // one item at a time: 2 goes back to open
  expect(l.items.map(i => i.status)).toEqual(['done', 'open', 'doing', 'open'])
  l = applyChecklist(l, { doing: 1 })                                          // a done item stays done
  expect(l.items[0]?.status).toBe('done')
})

test('bad input changes nothing; new items replace the list; empty text gets a name', async () => {
  const l = write(['a', 'b'])
  expect(applyChecklist(l, { done: [0, 3, 1.5, -1], doing: 9 }, T0)).toEqual(l)
  expect(applyChecklist(l, { size: 'Huge' }, T0).size).toBe('Normal')
  expect(applyChecklist(l, { items: ['x', '  '] }, T0).items.map(i => i.text)).toEqual(['x', 'Item 2'])
  expect(applyChecklist(l, {}, T0)).toEqual(l)
})

test('the reply tells Claude what is open, and that "All done!" needs every item ticked', async () => {
  let l = applyChecklist(write(['a', 'b', 'c']), { done: [1, 3] })
  expect(checklistReply(l)).toMatch(/Checklist 2\/3 done, shown to the user above the prompt:\n\[x\] 1\. a\n\[ \] 2\. b\n\[x\] 3\. c\nOpen: 2\. .*could not finish or prove stays open, and your final answer says why; "All done!" needs every item ticked\./)
  l = applyChecklist(l, { done: [2] })
  expect(checklistReply(l)).toMatch(/Every item is ticked\. Now write your final answer, and do not call this tool after it\.$/)
  expect(checklistReply({ items: [] })).toMatch(/No checklist yet/)
})

test('the chat row is one short line', async () => {
  const l = write(['Columns', 'Tests', 'Proof'])
  expect(checklistToolRow({ size: 'Normal', items: ['a', 'b', 'c'] }, l)).toBe('☑ Checklist · Normal · 3 items')
  expect(checklistToolRow({ done: [1, 2], doing: 3 }, l)).toBe('☑ Checklist · ✔ 1, 2 · ▸ Proof')
  expect(checklistToolRow({}, undefined)).toBe('☑ Checklist')
})

test('a long list shows a window that keeps the item being worked on in view', async () => {
  let l = write(Array.from({ length: 12 }, (_, i) => `item ${i + 1}`))
  l = applyChecklist(l, { done: [1, 2, 3, 4, 5, 6], doing: 7 })
  expect(visibleItems(l, 5).map(i => i.n)).toEqual([6, 7, 8, 9, 10])
  expect(visibleItems(write(['a', 'b']), 5).map(i => i.n)).toEqual([1, 2])
  expect(visibleItems(l, 0)).toEqual([])
})

test('the meter always fills its width, with a visible cell for the item being worked on', async () => {
  for (const [done, doing] of [[[], undefined], [[1], 2], [[1, 2, 3], 4], [[1, 2, 3, 4], undefined]] as const) {
    const l = applyChecklist(write(['a', 'b', 'c', 'd']), { done: [...done], ...(doing ? { doing } : {}) })
    const m = meterCells(l, 24)
    expect(m.done + m.doing + m.left).toBe(24)
    if (doing) expect(m.doing).toBeGreaterThan(0)
  }
  expect(meterCells(write(['a', 'b', 'c', 'd']), 24)).toEqual({ done: 0, doing: 0, left: 24 })
  expect(meterCells({ items: [] }, 12)).toEqual({ done: 0, doing: 0, left: 12 })
})

test('the timer: each item counts its work time, the list counts from when it was written', async () => {
  let l = write(['a', 'b', 'c'])
  expect([l.startedAt, itemElapsed(l.items[0]!, T0)]).toEqual([T0, undefined])        // nothing worked on yet
  l = applyChecklist(l, { doing: 1 }, T0 + 5_000)
  expect(itemElapsed(l.items[0]!, T0 + 12_000)).toBe(7_000)                           // live while doing
  l = applyChecklist(l, { done: [1], doing: 2 }, T0 + 20_000)
  expect(itemElapsed(l.items[0]!, T0 + 99_000)).toBe(15_000)                          // frozen once done
  l = applyChecklist(l, { doing: 3 }, T0 + 30_000)                                    // 2 goes back to open with 10 s
  l = applyChecklist(l, { doing: 2 }, T0 + 40_000)                                    // picked up again: both stretches add
  l = applyChecklist(l, { done: [2] }, T0 + 45_000)
  expect(itemElapsed(l.items[1]!, T0 + 99_000)).toBe(15_000)
  expect(itemElapsed(l.items[2]!, T0 + 99_000)).toBe(10_000)                          // 3 went back to open at 40 s, after 10 s
  expect(listElapsed(l, T0 + 60_000, true)).toBe(60_000)                              // running: counts to now
  expect(listElapsed(l, T0 + 60_000, false)).toBe(45_000)                             // turn ended: frozen at the last call
})

test('the timer: ticking an item never started gives it no time; a new list starts again', async () => {
  let l = applyChecklist(write(['a', 'b']), { done: [1] }, T0 + 3_000)
  expect(itemElapsed(l.items[0]!, T0 + 9_000)).toBeUndefined()
  l = applyChecklist(l, { doing: 1 }, T0 + 4_000)                                     // a done item does not restart
  expect(l.items[0]).toEqual({ text: 'a', status: 'done' })
  l = applyChecklist(l, { items: ['x'] }, T0 + 50_000)
  expect([l.startedAt, l.items[0]?.ms, listElapsed({ items: [] }, T0, true)]).toEqual([T0 + 50_000, undefined, undefined])
  expect(itemElapsed({ text: 'clock skew', status: 'doing', since: T0 + 10 }, T0)).toBe(0)
})

test('the timer reads m:ss, and h:mm:ss from an hour', async () => {
  expect([formatElapsed(0), formatElapsed(999), formatElapsed(61_000), formatElapsed(3_599_999), formatElapsed(3_600_000), formatElapsed(37_230_000), formatElapsed(-5)])
    .toEqual(['0:00', '0:00', '1:01', '59:59', '1:00:00', '10:20:30', '0:00'])
})

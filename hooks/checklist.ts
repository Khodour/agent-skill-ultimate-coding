/**
 * The checklist's rules: the plugin's own `checklist` tool, which the skill asks
 * Claude to use for every small, normal and complex task. Claude writes its items
 * and ticks them as it works; the list belongs to the task (it lives on the run),
 * so a new message from the person starts without it. It only records: it never
 * blocks anything. Pure, so every rule is tested alone.
 */
import type { Checklist, ChecklistItem, Size } from '../types'

/** The tool as tool calls name it. */
export const CHECKLIST_TOOL = 'mcp__agent-skill-ultimate-coding__checklist'

/** The tool as Claude sees it. */
export const TOOL_NAME = 'checklist'
export const TOOL_DESCRIPTION =
  'The Ultimate Coding checklist: it stays on screen above the prompt while you work. ' +
  'Call it before your first edit with the size you chose and every item, in order (what you build on, each ask of the request, ' +
  'then the edge cases, risks and MUSTs that need work, then the proof). Then call it as you work: `doing` with the number of the item ' +
  'you start, `done` with the numbers of items built and checked, one step at a time, never all at the end. ' +
  'Sending `items` again replaces the list. Use this instead of any other task list, so the user sees one list. ' +
  'Before your final answer, tick what is built and checked, and leave open any item you could not finish or prove; the answer says why. That answer (with the code, when there are no files) is your last message, and nothing comes after it, not even this tool.'
export const TOOL_SCHEMA = {
  type: 'object',
  properties: {
    size: { type: 'string', enum: ['Trivial', 'Small', 'Normal', 'Complex'], description: 'the size you chose for the task' },
    items: { type: 'array', items: { type: 'string' }, description: 'every item, a few words each, in the order you will do them' },
    doing: { type: 'integer', description: 'the number (from 1) of the item you are starting now' },
    done: { type: 'array', items: { type: 'integer' }, description: 'numbers (from 1) of items now built and checked' },
  },
}

const SIZES: readonly Size[] = ['Trivial', 'Small', 'Normal', 'Complex']

/**
 * The list after one call of the tool. `items` writes a new list (all open);
 * `doing` marks one item as the one being worked on (any other goes back to
 * open); `done` ticks items. Numbers outside the list are ignored.
 */
export const applyChecklist = (list: Checklist | undefined, input: Record<string, unknown>): Checklist => {
  let next: Checklist = list ?? { items: [] }
  if (Array.isArray(input.items)) {
    const items = input.items.map((t, i): ChecklistItem => ({ text: typeof t === 'string' && t.trim() !== '' ? t.trim() : `Item ${i + 1}`, status: 'open' }))
    next = { items }
  }
  if (SIZES.includes(input.size as Size)) next = { ...next, size: input.size as Size }
  const at = (n: unknown): number => (typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= next.items.length ? n - 1 : -1)
  const doing = at(input.doing)
  if (doing >= 0) {
    next = { ...next, items: next.items.map((t, i) => (i === doing ? { ...t, status: t.status === 'done' ? 'done' : 'doing' } : t.status === 'doing' ? { ...t, status: 'open' } : t)) }
  }
  if (Array.isArray(input.done)) {
    const ticks = new Set(input.done.map(at).filter(i => i >= 0))
    next = { ...next, items: next.items.map((t, i) => (ticks.has(i) ? { ...t, status: 'done' } : t)) }
  }
  return next
}

/** Items done, being worked on and still open. */
export const countOf = (list: Checklist): { done: number; doing: number; open: number; total: number } => {
  const done = list.items.filter(t => t.status === 'done').length
  const doing = list.items.filter(t => t.status === 'doing').length
  return { done, doing, open: list.items.length - done - doing, total: list.items.length }
}

/** The tool's answer to Claude: where the list stands, and what is still open. */
export const checklistReply = (list: Checklist): string => {
  if (list.items.length === 0) return 'No checklist yet: send `items` (and `size`) to write one.'
  const { done, total } = countOf(list)
  const lines = list.items.map((t, i) => `${t.status === 'done' ? '[x]' : t.status === 'doing' ? '[>]' : '[ ]'} ${i + 1}. ${t.text}`)
  const open = list.items.flatMap((t, i) => (t.status === 'done' ? [] : [i + 1]))
  const left = open.length === 0
    ? 'Every item is ticked. Now write your final answer, and do not call this tool after it.'
    : `Open: ${open.join(', ')}. Tick each with \`done\` as soon as it is built and checked. An item you could not finish or prove stays open, and your final answer says why; "All done!" needs every item ticked.`
  return `Checklist ${done}/${total} done, shown to the user above the prompt:\n${lines.join('\n')}\n${left}`
}

/** The tool's row in the chat, in one short line: the list itself is above the prompt. */
export const checklistToolRow = (input: unknown, list: Checklist | undefined): string => {
  const f = (input ?? {}) as Record<string, unknown>
  if (Array.isArray(f.items)) return `☑ Checklist${typeof f.size === 'string' ? ` · ${f.size}` : ''} · ${f.items.length} items`
  const parts: string[] = []
  if (Array.isArray(f.done) && f.done.length > 0) parts.push(`✔ ${f.done.join(', ')}`)
  if (typeof f.doing === 'number') parts.push(`▸ ${list?.items[f.doing - 1]?.text ?? `item ${f.doing}`}`)
  return `☑ Checklist${parts.length > 0 ? ` · ${parts.join(' · ')}` : ''}`
}

/**
 * The items to draw, at most `rows`, each with its number. A long list shows a
 * window that keeps the item being worked on in view, with the one before it.
 */
export const visibleItems = (list: Checklist, rows: number): Array<ChecklistItem & { n: number }> => {
  const numbered = list.items.map((t, i) => ({ ...t, n: i + 1 }))
  if (rows <= 0) return []
  if (numbered.length <= rows) return numbered
  const doing = numbered.findIndex(t => t.status === 'doing')
  const firstOpen = numbered.findIndex(t => t.status !== 'done')
  const focus = doing >= 0 ? doing : Math.max(firstOpen, 0)
  const start = Math.min(Math.max(focus - 1, 0), numbered.length - rows)
  return numbered.slice(start, start + rows)
}

/** The meter's three parts in cells, `width` wide in total: done, being worked on, left. */
export const meterCells = (list: Checklist, width: number): { done: number; doing: number; left: number } => {
  const { done, doing, total } = countOf(list)
  if (total === 0) return { done: 0, doing: 0, left: width }
  const d = Math.round((done / total) * width)
  const g = doing > 0 ? Math.max(1, Math.round((doing / total) * width)) : 0
  const gFit = Math.min(g, width - d)
  return { done: d, doing: gFit, left: width - d - gFit }
}

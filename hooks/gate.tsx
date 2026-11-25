/**
 * Feature: the design-card gate. An edit that touches a Complex area waits
 * until a design card (the design_card tool) covers that area; the card is
 * drawn as a box under its row, labelled in the user's language. It enforces
 * a habit, not a safety rule, so a failure inside it lets the edit through.
 */
import { atom, read, update } from 'claude-code'
import type { ElementTable, EngineInterface } from 'claude-code'

import type { Area, Card, GateState, Lang } from '../types'
import { TOOL_DESCRIPTION, TOOL_NAME, TOOL_SCHEMA, cardRows, detectAreas, detectLang, label, readCard, waitMessage } from './gate-rules'
import { CARD_TOOL, isFinishedAnswer } from './progress'
import { SIZE_COLOR } from './tracker'

const EDIT_TOOLS = new Set(['Edit', 'Write', 'MultiEdit', 'NotebookEdit'])
const KEEP = 50
const OPEN: GateState = { hasCard: false, covered: [], pending: [] }
const gate = atom({ plugin: 'agent-skill-ultimate-coding', key: 'gate' } as const, OPEN)
const cards = atom({ plugin: 'agent-skill-ultimate-coding', key: 'cards' } as const, {})
const lang = atom({ plugin: 'agent-skill-ultimate-coding', key: 'lang' } as const, 'en')

/** The path and new text of an edit, whichever tool made it. */
const editOf = (input: Record<string, unknown>): { path: string; text: string } => {
  const path = String(input.file_path ?? input.notebook_path ?? '')
  const edits = Array.isArray(input.edits) ? input.edits.map(x => String((x as { new_string?: unknown }).new_string ?? '')) : []
  const text = [input.content, input.new_string, input.new_source, ...edits].filter(t => typeof t === 'string').join('\n')
  return { path, text }
}

/** Session start: the design_card tool, in the prompt's tool list. */
export async function gateStart($: EngineInterface): Promise<void> {
  await $.tool.register({ name: TOOL_NAME, description: TOOL_DESCRIPTION, inputSchema: TOOL_SCHEMA, isDeferred: false })
}

/** The user's message: the card's language follows theirs (unchanged when it has no letters). */
export async function gatePrompt($: EngineInterface, text: string): Promise<void> {
  if (/[A-Za-z؀-ۿ]/.test(text)) await update($, lang, () => detectLang(text))
}

/** Before a main-loop tool call: the message to hold an edit with, or null to let it through. */
export async function gateCheck($: EngineInterface, tool: string, input: unknown): Promise<string | null> {
  if (!EDIT_TOOLS.has(tool)) return null
  const { path, text } = editOf(input as Record<string, unknown>)
  const g = await read($, gate)
  const uncovered = detectAreas(path, text).filter(a => !g.covered.includes(a))
  if (uncovered.length === 0) return null
  await update($, gate, s => ({ ...s, pending: uncovered }))
  return waitMessage(uncovered, g.hasCard, await read($, lang))
}

/** The design_card tool itself: check the card against what is asked, record it, widen what is covered. */
export async function gateCardRun($: EngineInterface, id: string, input: unknown) {
  const g = await read($, gate)
  const checked = readCard(input as Record<string, unknown>, g.pending)
  if ('missing' in checked) return { deny: `design_card: missing ${checked.missing}.` }
  const covered: Area[] = [...new Set([...g.covered, ...checked.covers])]
  await update($, gate, () => ({ hasCard: true, covered, pending: g.pending.filter(a => !covered.includes(a)) }))
  const entry = { card: checked.card, lang: await read($, lang) }
  await update($, cards, all => Object.fromEntries([...Object.entries(all), [id, entry]].slice(-KEEP)))
  return { result: `Design card recorded (${checked.card.size}). Edits that touch ${covered.join(', ') || 'no Complex area'} are open for this task.` }
}

/** A turn ended: a finished task (a report with no questions) frees the gate for the next one. */
export async function gateTurnEnd($: EngineInterface, answer: string): Promise<void> {
  if (isFinishedAnswer(answer)) await update($, gate, () => OPEN)
}

/** The card's box under its design_card row, or null for any other row. */
export async function gateUnderRow($: EngineInterface, tool: string, id: string, ui: Pick<ElementTable, 'Box' | 'Text'>) {
  if (tool !== CARD_TOOL) return null
  const entry = (await read($, cards))[id]
  if (entry === undefined) return null
  const { Box, Text } = ui
  const { card, lang: l }: { card: Card; lang: Lang } = entry
  const width = Math.max(...cardRows(card, l).map(([k]) => k.length)) + 2
  return (
    <Box flexDirection="column" borderStyle="round" borderColor="#4ade80" paddingX={1}>
      <Text>
        <Text color="#4ade80" bold>{label('title', l)} · </Text>
        <Text color={SIZE_COLOR[card.size]} bold>{label(card.size, l)}</Text>
      </Text>
      {cardRows(card, l).map(([k, v]) => <Text><Text dimColor>{k.padEnd(width)}</Text>{v}</Text>)}
    </Box>
  )
}

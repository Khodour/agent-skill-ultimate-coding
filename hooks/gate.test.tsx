import { expect, mock, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'
import type { On } from 'claude-code'

const CARD = 'mcp__agent-skill-ultimate-coding__design_card'
const FULL = { size: 'Complex', job: 'refund an order', mirror: 'orders/cancel.ts', edges: 'zero, partial, twice',
  twice: 'idempotency key', data: 'orders and refunds in one transaction', load: 'one per request', musts: '6, 7',
  done_when: 'tests for partial and repeat', risks: 'double refund' } // check-diff: ok "double refund" is the card's text, not a floating-point type

/** Stands in for Claude Code. The card tool never reaches it: the plugin answers design_card itself, before the permission check. */
const engine = ($: Engine, on: On) => {
  mock.clock(on)
  on('tool.call', (_, e) => {
    if (e.tool === CARD) throw new Error('design_card reached Claude Code: it would face a permission check')
    return { result: {} } as never
  })
  on('tool.register', () => ({ value: { tool: CARD } }) as never)
  on('command.register', () => ({ value: { command: 'uc-score' } }) as never)
  on('process.run', () => ({ value: { exitCode: 0, stdout: '', stderr: '' } }) as never)
  on('session.cwd', () => ({ value: '/p' }) as never)
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('turn.complete', (_, e) => ({ text: e.answer }))
}
const call = async ($: Engine, input: object) =>
  (await $.tool.call(input as never)) as { deny?: string; isError?: boolean; text?: string; result?: unknown }
const MONEY_EDIT = { tool: 'Edit', file_path: '/p/src/refund.ts', old_string: 'a', new_string: 'const refund = amount' }
const MIGRATION_EDIT = { tool: 'Write', file_path: '/p/db/migrations/0042.sql', content: 'ALTER TABLE refunds ADD COLUMN note text' }

test('a money edit waits for a card that covers money, then goes through', async ($, on) => {
  engine($, on)
  await $.session.start({ cwd: '/p', surface: 'terminal', isInteractive: true })
  expect((await call($, MONEY_EDIT)).deny).toContain('touches money')
  expect((await call($, { tool: CARD, ...FULL })).deny).toContain('missing money')       // no money line yet
  expect(String((await call($, { tool: CARD, ...FULL, money: 'integer cents; parts add up' })).result)).toContain('money')
  expect((await call($, MONEY_EDIT)).deny).toBe(undefined)
})

test('a new area later asks only for its own line', async ($, on) => {
  engine($, on)
  await $.session.start({ cwd: '/p', surface: 'terminal', isInteractive: true })
  await call($, MONEY_EDIT)
  await call($, { tool: CARD, ...FULL, money: 'integer cents' })
  const wait = (await call($, MIGRATION_EDIT)).deny ?? ''
  expect(wait).toContain('also touches migration')
  expect(wait.includes('money (')).toBe(false)
  await call($, { tool: CARD, ...FULL, way_back: 'a down migration, tested' })
  expect((await call($, MIGRATION_EDIT)).deny).toBe(undefined)
  expect((await call($, MONEY_EDIT)).deny).toBe(undefined)                            // money stays covered
})

test('plain edits are never held, and a finished task frees the gate', async ($, on) => {
  engine($, on)
  await $.session.start({ cwd: '/p', surface: 'terminal', isInteractive: true })
  expect((await call($, { tool: 'Write', file_path: '/p/src/slug.ts', content: 'export const s = 1' })).deny).toBe(undefined)
  await call($, MONEY_EDIT)
  await call($, { tool: CARD, ...FULL, money: 'integer cents' })
  await $.turn.complete({ answer: '### 1. What was done\n**Confidence: High 🟢** done', durationMs: 1, isAborted: false, turnId: 't', reason: 'completed' } as never)
  expect((await call($, MONEY_EDIT)).deny).toContain('touches money')                  // a new task needs its own card
})

test('after an Arabic message, the gate asks for the card in Arabic', async ($, on) => {
  engine($, on)
  on('prompt.submit', (_, e) => ({ text: e.text }))
  await $.session.start({ cwd: '/p', surface: 'terminal', isInteractive: true })
  await $.prompt.submit({ text: 'أضف خاصية الاسترجاع للطلبات' } as never)
  expect((await call($, MONEY_EDIT)).deny).toContain('in Arabic')
})

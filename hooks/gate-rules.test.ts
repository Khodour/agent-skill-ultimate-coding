import { expect, test } from 'claude-code/testing'
import { cardRows, detectAreas, detectLang, readCard, requiredFields, waitMessage } from './gate-rules'

test('each Complex area is found from the path or the new text', async () => {
  expect(detectAreas('src/billing.ts', 'const refund = amount - fee')).toEqual(['money'])
  expect(detectAreas('src/x.py', 'if not user.has_permission("edit"):')).toEqual(['access'])
  expect(detectAreas('src/x.go', 'u.Email = input.Email')).toEqual(['privacy'])
  expect(detectAreas('db/migrations/0042_add.sql', 'SELECT 1')).toEqual(['migration'])
  expect(detectAreas('schema.sql', 'ALTER TABLE orders ADD COLUMN note text')).toEqual(['migration'])
  expect(detectAreas('stock.rb', 'Stock.transaction do')).toEqual(['race'])
  expect(detectAreas('src/api/orders.ts', 'export const list = () => []')).toEqual(['compat'])
  expect(detectAreas('src/u.py', 'user_email = form.user_email')).toEqual(['privacy'])
  expect(detectAreas('src/r.ts', 'const refund_amount = 0')).toEqual(['money'])
  expect(detectAreas('src/pay.ts', 'await db.transaction(async () => charge(cents))')).toEqual(['money', 'race'])
})

test('plain code, docs and lock files are never gated', async () => {
  expect(detectAreas('src/x.ts', 'const amountain = rolesque')).toEqual([])
  expect(detectAreas('src/slug.ts', 'export const slugify = (t: string) => t.toLowerCase()')).toEqual([])
  expect(detectAreas('README.md', 'Payments, refunds and ALTER TABLE are covered here.')).toEqual([])
  expect(detectAreas('package-lock.json', '"jwt": "1.0.0"')).toEqual([])
})

test('a card for pending areas must be Complex, complete, and real', async () => {
  const full = { size: 'Complex', job: 'refund an order', mirror: 'orders/cancel.ts', edges: 'zero, partial, twice',
    twice: 'idempotency key', data: 'orders, refunds in one transaction', load: 'one per request', musts: '6, 7',
    done_when: 'tests for partial and repeat', risks: 'double refund' } // check-diff: ok "double refund" is the card's text, not a floating-point type
  expect(readCard({ ...full, size: 'Normal' }, ['money'])).toEqual({ missing: 'size "Complex": this task touches money' })
  expect('missing' in readCard(full, ['money'])).toBe(true)
  expect(readCard({ ...full, money: 'n/a' }, ['money'])).toEqual({ missing: 'money (a real answer each; "n/a" and the like do not count)' })
  const ok = readCard({ ...full, money: 'integer cents; parts add up' }, ['money'])
  expect('card' in ok && ok.covers).toEqual(['money'])
})

test('without pending areas a card only needs its own size', async () => {
  expect(requiredFields('Small', [])).toEqual(['job', 'edges', 'done_when'])
  expect(requiredFields('Small', ['migration'])).toContain('way_back')
  expect('card' in readCard({ size: 'Small', job: 'greet', edges: 'empty', done_when: 'test' }, [])).toBe(true)
})

test('the wait message names only what is missing, and asks for Arabic when the user writes Arabic', async () => {
  const first = waitMessage(['money', 'migration'], false, 'en')
  expect(first).toContain('touches money, migration')
  expect(first).toContain('way_back (')
  const again = waitMessage(['race'], true, 'en')
  expect(again).toContain('does not cover yet')
  expect(again.includes('money')).toBe(false)
  expect(waitMessage(['money'], false, 'ar')).toContain('in Arabic')
})

test('the language follows the user, and the card is labelled in it', async () => {
  expect(detectLang('أضف خاصية الاسترجاع للطلبات')).toBe('ar')
  expect(detectLang('add refunds to orders')).toBe('en')
  expect(detectLang('أضف refund للطلبات')).toBe('ar')
  const card = { size: 'Small' as const, job: 'تحية المستخدم', edges: 'اسم فارغ', done_when: 'اختبار' }
  expect(cardRows(card, 'ar')).toEqual([['المهمة', 'تحية المستخدم'], ['الحالات الحدية', 'اسم فارغ'], ['يكتمل عندما', 'اختبار']])
  expect(cardRows(card, 'en')[0]).toEqual(['Job', 'تحية المستخدم'])
})

import { expect, test } from 'claude-code/testing'
import { doneWord, onAnswer, onCard, onPrompt, onTool, spinnerWord, startRun } from './progress'

test('a run moves through the moments from tool calls and the final answer', async () => {
  let r = startRun()
  expect(spinnerWord(r)).toBe('Understanding')
  r = onCard(r, 'Normal')
  expect([r.reached, r.size]).toEqual([1, 'Normal'])
  r = onTool(r, 'Edit', undefined, false)
  expect(spinnerWord(r)).toBe('Building')
  r = onTool(r, 'Bash', 'npm test', false)
  r = onTool(r, 'Bash', 'npx tsc -p .', true)
  expect([r.current, r.checks, r.failed]).toEqual([3, 2, 1])
  r = onTool(r, 'Edit', undefined, false)            // a fix after Verify
  expect([r.current, r.reached]).toEqual([2, 3])
  r = onAnswer(r, '### 1. What was done\n...\n**Confidence: Medium 🟡** no users yet')
  expect([r.current, r.confidence, r.isPaused]).toEqual([4, 'Medium', false])
  expect(doneWord(r)).toBe('Reported')
})

test('reading and listing do not move the run', async () => {
  let r = onTool(startRun(), 'Read', undefined, false)
  r = onTool(r, 'Bash', 'ls -la', false)
  expect([r.current, r.reached, r.checks]).toEqual([0, 0, 0])
})

test('a second card updates the size without moving back; an unknown size gives no badge', async () => {
  const r = onCard(onTool(onCard(startRun(), 'Small'), 'Edit', undefined, false), 'Normal')
  expect([r.current, r.reached, r.size]).toEqual([2, 2, 'Normal'])
  expect(onCard(startRun(), 'Huge').size).toBe(undefined)
})

test('a run that stops to ask carries on after the answer', async () => {
  const asked = onAnswer(onTool(startRun(), 'Edit', undefined, false), '### 1. What was done\n### 3. Waiting for you\n1. ?')
  expect(asked.isPaused).toBe(true)
  expect(onPrompt(asked)).toEqual({ ...asked, isDone: false, isPaused: false })
  const early = onAnswer(onTool(startRun(), 'Edit', undefined, false), 'Before I change anything: which file?')
  expect(onPrompt(early)?.current).toBe(2)
})

test('a finished run clears on the next message, and so does an old saved run', async () => {
  expect(onPrompt(onAnswer(startRun(), '### 1. What was done\n**Confidence: High 🟢** all ran'))).toBe(null)
  expect(onPrompt({ ...startRun(), isDone: true })).toBe(null)
  expect(onPrompt(null)).toBe(null)
})

test('a plain summary with a confidence line counts as the report, as in a real session', async () => {
  const answer = 'I added refundableCents with 6 tests, and all 6 pass.\n\nConfidence: High 🟢 — all 6 tests pass.'
  const r = onAnswer(onTool(startRun(), 'Edit', undefined, false), answer)
  expect([r.reached, r.confidence, r.isPaused]).toEqual([4, 'High', false])
  expect(onPrompt(r)).toBe(null)
})

test('a summary without a confidence line is not a report: the task stays open', async () => {
  const r = onAnswer(onTool(startRun(), 'Edit', undefined, false), 'I added the function. Want tests too?')
  expect([r.reached, r.isPaused]).toEqual([2, true])
})

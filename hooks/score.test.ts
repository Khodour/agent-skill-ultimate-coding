import { expect, test } from 'claude-code/testing'
import { onAnswer, onCard, startRun } from './progress'
import { bar, countFinish, countTool, emptyScore } from './score'

test('a finished task counts once, by size and confidence', async () => {
  const before = onCard(startRun(), 'Normal')
  const after = onAnswer(before, '### 1. What was done\n**Confidence: High 🟢** all ran')
  const s = countFinish(emptyScore(), before, after)
  expect([s.tasks.Normal, s.confidence.High]).toEqual([1, 1])
})

test('a paused task is not counted yet; one with no card counts as Unsized', async () => {
  const paused = onAnswer(startRun(), 'Before I change anything: which file?')
  expect(countFinish(emptyScore(), startRun(), paused)).toEqual(emptyScore())
  const asks = onAnswer(startRun(), '### 1. What was done\n**Confidence: Medium 🟡** x\n### 3. Waiting for you\n1. ?')
  expect(countFinish(emptyScore(), startRun(), asks).confidence.Medium).toBe(1)   // a report that asks questions is finished
  const done = onAnswer(startRun(), '### 1. What was done\n**Confidence: Low 🔴** no tests')
  expect(countFinish(emptyScore(), startRun(), done).tasks.Unsized).toBe(1)
  expect(countFinish(emptyScore(), null, null)).toEqual(emptyScore())
})

test('edits, cards and checks are counted; failed edits and refused cards are not', async () => {
  let s = emptyScore()
  s = countTool(s, 'Write', undefined, false, false)
  s = countTool(s, 'Edit', undefined, true, false)
  s = countTool(s, 'mcp__agent-skill-ultimate-coding__design_card', undefined, false, true)
  s = countTool(s, 'mcp__agent-skill-ultimate-coding__design_card', undefined, true, true)
  s = countTool(s, 'Bash', 'npm test', false, false)
  s = countTool(s, 'Bash', 'npx tsc -p .', true, false)
  s = countTool(s, 'Bash', 'ls', false, false)
  expect([s.edits, s.cards, s.checks, s.checksFailed]).toEqual([1, 1, 2, 1])
})

test('bars are capped and zero shows a thin mark', async () => {
  expect([bar(0), bar(3), bar(99, 5)]).toEqual(['▏', '███', '█████'])
})

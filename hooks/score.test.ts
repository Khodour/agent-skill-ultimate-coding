import { expect, test } from 'claude-code/testing'
import { onAnswer, onSize, startRun } from './progress'
import { bar, countFinish, countTool, emptyScore } from './score'

test('a finished task counts once, by size and confidence', async () => {
  const before = onSize(startRun(), 'Normal')
  const after = onAnswer(before, '### 1. What was done\n**Confidence: High 🟢** all ran')
  const s = countFinish(emptyScore(), before, after)
  expect([s.tasks.Normal, s.confidence.High]).toEqual([1, 1])
})

test('a paused task is not counted yet; one with no size counts as Unsized', async () => {
  const paused = onAnswer(startRun(), 'Before I change anything: which file?')
  expect(countFinish(emptyScore(), startRun(), paused)).toEqual(emptyScore())
  const asks = onAnswer(startRun(), '### 1. What was done\n**Confidence: Medium 🟡** x\n### 3. Waiting for you\n1. ?')
  expect(countFinish(emptyScore(), startRun(), asks).confidence.Medium).toBe(1)   // a report that asks questions is finished
  const done = onAnswer(startRun(), '### 1. What was done\n**Confidence: Low 🔴** no tests')
  expect(countFinish(emptyScore(), startRun(), done).tasks.Unsized).toBe(1)
  expect(countFinish(emptyScore(), null, null)).toEqual(emptyScore())
})

test('edits and checks are counted; failed edits and plain commands are not', async () => {
  let s = emptyScore()
  s = countTool(s, 'Write', undefined, false)
  s = countTool(s, 'Edit', undefined, true)
  s = countTool(s, 'TaskCreate', undefined, false)
  s = countTool(s, 'Bash', 'npm test', false)
  s = countTool(s, 'Bash', 'npx tsc -p .', true)
  s = countTool(s, 'Bash', 'ls', false)
  expect([s.edits, s.checks, s.checksFailed]).toEqual([1, 2, 1])
})

test('bars are capped and zero shows a thin mark', async () => {
  expect([bar(0), bar(3), bar(99, 5)]).toEqual(['▏', '███', '█████'])
})

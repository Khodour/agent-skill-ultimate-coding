import { expect, test } from 'claude-code/testing'
import type { Run } from '../types'
import {
  asksPerson, classifyPrompt, confidenceOf, hasAgents, isCheckCommand, isFinishedAnswer, isTaskWork, onAgent, onAnswer, onPrompt, onSize, onTool,
  onTurnStart, sizeInText, startRun, turnEnd,
} from './progress'

/** onAnswer for a run that is not tentative, which is never dropped. */
const answered = (r: Run, answer: string, end: Parameters<typeof onAnswer>[2] = 'answer'): Run => onAnswer(r, answer, end) as Run
const REPORT = '### 1. What was done\n...\n**Confidence: Medium 🟡** no users yet'

test('a run counts its checks and keeps the size Claude named; it never holds a step', async () => {
  let r = onSize(startRun(), 'Normal')
  r = onTool(r, 'Edit', undefined, false)
  r = onTool(r, 'Bash', 'npm test', false)
  r = onTool(r, 'Bash', 'npx tsc -p .', true)
  expect([r.size, r.checks, r.failed, r.isDone]).toEqual(['Normal', 2, 1, false])
  expect(Object.keys(r).sort()).toEqual(['checks', 'confidence', 'failed', 'isDone', 'size'])
  expect(onSize(startRun(), 'Huge').size).toBe(undefined)
})

test('only commands that run a check count as checks, not ones that mention a test', async () => {
  const checks = ['npm test', 'pytest -q', 'python -m pytest tests/', 'npx tsc -p .', 'cd app && npm run build', 'yarn lint',
    'go test ./...', 'cargo clippy', './gradlew :app:testDebugUnitTest', './gradlew :app:assembleDebug', 'claude plugin validate .',
    'bash "/a b/scripts/check-diff.sh"', 'bash tests/check-diff/run.sh', 'CI=1 npx vitest run', 'make test', 'php artisan test',
    // forms seen in a live session: a path before the program
    'S=/tmp/x && $S/venv/bin/python -m pytest -q test_calc.py 2>&1 | tail -5', '/tmp/v/bin/python3.12 -m pytest',
    '/bin/bash "/a b/scripts/check-diff.sh" --files calc.py', './node_modules/.bin/jest', '.venv/bin/ruff check .',
    '"$S/venv/bin/python" -m pytest -q -p no:cacheprovider 2>&1; echo "exit=$?"', 'PY=/v/bin/python; "$PY" -m pytest -q | tail -8']
  const looks = ['test -f calc.py', '[ -f calc.py ] && echo ok', 'ls tests/', 'cat test_calc.py', 'git status', 'which tsc',
    'grep -rn "pytest" .', 'ls -la && git status --short && (test -f calc.py && cat calc.py)', 'echo build done',
    'python3 -m pytest --version 2>&1; git status --short', 'npx tsc --version', 'cat "/a/check-diff.sh"',
    'python3 -m venv /tmp/v', 'python3 -m pip install pytest', 'python -m http.server']
  for (const c of checks) expect([c, isCheckCommand(c)]).toEqual([c, true])
  for (const c of looks) expect([c, isCheckCommand(c)]).toEqual([c, false])
})

test('task work is a checklist item, an edit, a check or a hand-off to a subagent; reading is not', async () => {
  expect(['TaskCreate', 'TodoWrite', 'Edit', 'Write', 'Agent', 'Task'].map(t => isTaskWork(t, undefined)))
    .toEqual([true, true, true, true, true, true])
  expect(isTaskWork('TaskList', undefined)).toBe(false)                         // only looks
  expect([isTaskWork('Bash', 'npm test'), isTaskWork('Bash', 'ls'), isTaskWork('Read', undefined), isTaskWork('Grep', undefined)])
    .toEqual([true, false, false, false])
})

// ---- Every way a turn can end ----

test('an answered turn is done and keeps the report\'s confidence', async () => {
  const work = onTool(startRun(), 'Edit', undefined, false)
  const done = answered(work, REPORT)
  expect([done.isDone, done.stop, done.confidence]).toEqual([true, undefined, 'Medium'])
  expect(answered(work, 'I added the function.').confidence).toBe(null)       // no confidence line
})

test('an answer asks the person when it has a "Waiting for you" part or a question in its last paragraph', async () => {
  expect(asksPerson('### 1. What was done\nx\n### 3. Waiting for you\n1. commit?')).toBe(true)
  expect(asksPerson('Done. Should I also add tests?')).toBe(true)
  expect(asksPerson('I added the function.')).toBe(false)
  // seen live: the question is not on the last line
  expect(asksPerson('**Confidence: High 🟢** x\n\nShould I commit these two files to `main`? If yes, I will propose a message.')).toBe(true)
  expect(asksPerson('Is it fast? Yes: 3 ms.\n\nAll done.')).toBe(false)       // a question earlier, not at the end
})

test('the report shape the user\'s session wrote (bold headings, no numbers) is still a report', async () => {
  const bold = 'You can now make banners.\n\n**Checks**\n- ✅ syntax\n\n**Needs attention**\n- x\n\n**Waiting for you**\n1. Commit?'
  expect(isFinishedAnswer(bold)).toBe(true)
  expect(asksPerson(bold)).toBe(true)
  expect(isFinishedAnswer('**Confidence: High 🟢** all ran')).toBe(true)
  expect(isFinishedAnswer('I changed the name.')).toBe(false)
})

test('Esc, an API error or a refusal: stopped, and a new turn works again', async () => {
  const work = onTool(startRun(), 'Edit', undefined, false)
  expect((['aborted', 'error', 'refusal'] as const).map(end => answered(work, '', end).stop)).toEqual(['aborted', 'error', 'refusal'])
  expect(answered(work, '', 'error').isDone).toBe(true)
  expect(answered(work, '**Confidence: High 🟢** x', 'aborted').confidence).toBe(null)   // a stopped turn gave no report
  const again = onTurnStart(answered(work, '', 'aborted')) as Run
  expect([again.isDone, again.stop]).toEqual([false, undefined])
  expect(onTurnStart(null)).toBe(null)
  expect([turnEnd('aborted'), turnEnd('completed'), turnEnd(undefined)]).toEqual(['aborted', 'answer', 'answer'])
})

test('a tentative run is dropped when its turn was only a question; kept when it did task work, reported or was stopped', async () => {
  const t = startRun(true)
  expect(onAnswer(t, 'average([1, 2]) returns 1.5.')).toBe(null)
  expect(onAnswer(onTool(t, 'Bash', 'pytest -q', false), 'All 5 pass.')).toBe(null)       // a check only looks
  expect(onTool(t, 'Read', undefined, false).isTentative).toBe(true)
  expect(onTool(t, 'Edit', undefined, false).isTentative).toBe(undefined)
  expect(onTool(t, 'Agent', undefined, false).isTentative).toBe(undefined)
  expect(onSize(t, 'Small').isTentative).toBe(undefined)
  expect(onTool(t, 'TaskCreate', undefined, false).isTentative).toBe(undefined)   // a checklist item makes it a task
  expect((onAnswer(t, '', 'aborted') as Run).stop).toBe('aborted')                       // Esc on a new task: kept, not dropped
  expect((onAnswer(t, REPORT) as Run).isDone).toBe(true)
})

// ---- Every prompt source ----

test('only the person\'s own new message, sent while idle, is new; everything else is the same work or nothing', async () => {
  const idle = (kind: string, extra: object = {}) => classifyPrompt({ origin: { kind, ...extra } })
  expect(['composer', 'bridge', 'sdk', 'scheduled-trigger', 'channel', 'coordinator', 'projects-relay', 'slack-ping'].map(k => idle(k)))
    .toEqual(Array(8).fill('new'))
  expect(['task-notification', 'peer', 'peer-send-message', 'observer', 'observer-activity', 'auto-continuation', 'unclassified', 'plugin']
    .map(k => idle(k))).toEqual(Array(8).fill('same'))
  expect(idle('plugin', { asUser: true })).toBe('new')
  expect(classifyPrompt({ origin: { kind: 'composer' }, turnId: 't1' })).toBe('same')        // typed into the running turn
  expect(classifyPrompt({ origin: { kind: 'composer' }, command: { name: 'uc-score' } })).toBe('none')
  expect(classifyPrompt({ origin: { kind: 'unclassified' }, isMeta: true })).toBe('none')
  expect(classifyPrompt({})).toBe('new')                                                      // an engine with no origins: the person typed it
})

test('the person\'s new message clears an ended run; nothing else does, and nothing clears a busy one', async () => {
  const ended = answered(onTool(startRun(), 'Edit', undefined, false), '### 3. Waiting for you\n1. ok?')
  expect(onPrompt(ended, 'new')).toBe(null)                                                  // even a waiting one: start fresh
  expect(onPrompt(ended, 'same')).toBe(ended)
  expect(onPrompt(ended, 'none')).toBe(ended)
  const working = onTool(startRun(), 'Edit', undefined, false)
  expect(onPrompt(working, 'new')).toBe(working)
  const agentBusy = onAgent(ended, 'a1', true)
  expect(onPrompt(agentBusy, 'new')).toBe(agentBusy)
  expect(onPrompt(null, 'new')).toBe(null)
})

// ---- The size Claude names, subagents ----

test('the size is read only from a line where Claude names it, never from the task\'s words', async () => {
  expect(sizeInText('Size: Normal\n\nI will start with the columns.')).toBe('Normal')
  expect(sizeInText('Plan.\n\n**Size:** complex, it moves money')).toBe('Complex')
  expect(sizeInText('Checklist (Small)\n1. format the duration')).toBe('Small')
  expect(sizeInText('## Checklist · Trivial')).toBe('Trivial')
  expect(sizeInText('This is a complex refund with a normal flow and a small fee.')).toBe(null)
  expect(sizeInText('The font size is small.')).toBe(null)                      // not at a line start
  expect(sizeInText('Checklist done.')).toBe(null)
})

test('a run stays busy while subagents work, even after the main turn ended', async () => {
  const handed = onTool(startRun(true), 'Agent', undefined, false)
  const ended = answered(onAgent(handed, 'a1', true), 'The subagent is working in the background.')
  expect([ended.isDone, hasAgents(ended)]).toEqual([true, true])                 // the turn ended, the run is still busy
  const two = onAgent(onAgent(ended, 'a2', true), 'a1', false)
  expect(two.agents).toEqual(['a2'])
  const done = onAgent(two, 'a2', false)
  expect([done.agents, hasAgents(done), done.isDone]).toEqual([undefined, false, true])
})

test('confidence is read from the agent\'s own words, and from the older label', async () => {
  expect(confidenceOf('**I have high confidence in this change** 🟢 because 42 tests passed')).toBe('High')
  expect(confidenceOf('I have medium confidence in these changes 🟡 because x')).toBe('Medium')
  expect(confidenceOf('**I have low confidence in this change** 🔴 because the tests did not run.\n1. run pytest')).toBe('Low')
  expect(confidenceOf('**Confidence: Medium 🟡** older reports still read')).toBe('Medium')
  expect(confidenceOf('I have no confidence the old code was right.')).toBe(null)
  expect(confidenceOf('Low confidence intervals are a statistics term.')).toBe(null)
  expect(answered(startRun(), 'Search now works.\n\n**I have low confidence in this change** 🔴 because x').confidence).toBe('Low')
  expect(isFinishedAnswer('All done! ✅ tests 4/4\n\n**I have high confidence in this change** 🟢 because all passed')).toBe(true)
})

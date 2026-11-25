import { expect, test } from 'claude-code/testing'
import { REPORT_NUDGE, asksOwnReply, editedLines, reportNudge, ruleFolders, setsOwnFormat } from './report-rules'
import type { StopFacts } from './report-rules'

/** A stop after real code work, with no Confidence line: the one case that is nudged. */
const base: StopFacts = {
  isContinuing: false, lastMessage: 'I added the export and the tests pass.', backgroundTasks: 0,
  editedLines: 40, skillUsed: true, projectHasFormat: false, personSetReply: false,
}

test('a turn that changed code and stops without the Confidence line is asked once for the report', async () => {
  expect(reportNudge(base)).toBe(REPORT_NUDGE)
  expect(REPORT_NUDGE).toMatch(/What was done.*Needs attention.*Confidence/)
  expect(REPORT_NUDGE).toMatch(/do not redo/)
  expect(REPORT_NUDGE).toMatch(/person asked .* different kind of reply, give them that reply again/)   // the person's own words win
})

test('it never nudges twice, when the skill was not used, or when the project sets its own format', async () => {
  expect(reportNudge({ ...base, isContinuing: true })).toBe(null)
  expect(reportNudge({ ...base, skillUsed: false })).toBe(null)
  expect(reportNudge({ ...base, projectHasFormat: true })).toBe(null)
  expect(reportNudge({ ...base, personSetReply: true })).toBe(null)
})

test('it lets Claude stop when background work is running, no code changed, or the edit was trivial', async () => {
  expect(reportNudge({ ...base, backgroundTasks: 1 })).toBe(null)
  expect(reportNudge({ ...base, editedLines: 0 })).toBe(null)
  expect(reportNudge({ ...base, editedLines: 3 })).toBe(null)
  expect(reportNudge({ ...base, editedLines: 4 })).toBe(REPORT_NUDGE)
})

test('a report with its Confidence line, in any shape, passes; a clarifying question passes; a bold report without confidence does not', async () => {
  expect(reportNudge({ ...base, lastMessage: '### 1. What was done\n...\n**Confidence: High 🟢** all ran' })).toBe(null)
  expect(reportNudge({ ...base, lastMessage: 'Done.\n\nConfidence: Medium 🟡 not run on the emulator' })).toBe(null)
  expect(reportNudge({ ...base, lastMessage: 'Before I go on: should the logo be on by default?' })).toBe(null)
  // the user's real session: bold parts, a question at the end, no Confidence line
  const bold = 'You can now make banners.\n\n**What changed:**\n- x\n\n**Waiting for you**\n1. Should I deploy this?'
  expect(reportNudge({ ...base, lastMessage: bold })).toBe(REPORT_NUDGE)
})

test('edited lines are counted from each edit tool\'s input', async () => {
  expect(editedLines('Write', { content: 'a\nb\nc' })).toBe(3)
  expect(editedLines('Edit', { old_string: 'x', new_string: 'y\nz' })).toBe(2)
  expect(editedLines('MultiEdit', { edits: [{ new_string: 'a' }, { new_string: 'b\nc' }] })).toBe(3)
  expect(editedLines('NotebookEdit', { new_source: 'print(1)' })).toBe(1)
  expect([editedLines('Read', { file_path: 'a' }), editedLines('Edit', { new_string: '' }), editedLines('Bash', { command: 'ls' })]).toEqual([0, 0, 0])
})

test('a project sets its own format only when its rules name one for the report or final message', async () => {
  const own = ['## Reporting\nEnd every task with a short summary: what changed, how it was tested.',
    'Final message: three bullet points, no headings.', 'Use this report format: Done / Next / Risks.',
    'The reply style is plain prose, no headings.', 'Structure of the summary: one paragraph per change.']
  const not = ['Run the tests with `python3 -m unittest`.', 'Format code with black before committing.',
    'The API returns a JSON report of shipments.', 'For every coding task, load the agent-skill-ultimate-coding skill first and follow it.',
    '`address_format(dto)` | one-line address']
  for (const t of own) expect([t, setsOwnFormat(t)]).toEqual([t, true])
  for (const t of not) expect([t, setsOwnFormat(t)]).toEqual([t, false])
})

test('rules apply from the working directory up to, not including, the home folder', async () => {
  expect(ruleFolders('/Users/a/code/shop/php', '/Users/a')).toEqual(['/Users/a/code/shop/php', '/Users/a/code/shop', '/Users/a/code'])
  expect(ruleFolders('/srv/app/', '/home/x')).toEqual(['/srv/app', '/srv'])
})

test('the person asking for another kind of reply is recognised; an ordinary request is not', async () => {
  const own = ['Add product(xs) and run the test. When done, reply with ONE line only, no report.', 'fix it, no report please',
    'just tell me if it works', 'keep it short', 'answer briefly', 'reply in one sentence', 'only the diff please', 'tl;dr when done']
  const plain = ['Add product(xs) to calc.py with a pytest test and run it.', 'Fix the bug where items at the reorder level are not flagged.',
    'Write a short function that returns the mean.', 'Make the report page load faster.', 'Add a one-to-many relation for orders.']
  for (const t of own) expect([t, asksOwnReply(t)]).toEqual([t, true])
  for (const t of plain) expect([t, asksOwnReply(t)]).toEqual([t, false])
})

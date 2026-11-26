import { expect, test } from 'claude-code/testing'
import { parseCheck, tally } from './checkdiff-parse'

const hook = (report: string) =>
  JSON.stringify({ hookSpecificOutput: { hookEventName: 'PostToolUse', additionalContext: report } })

test('a finding is read with its line, rule and MUST', async () => {
  const report = 'check-diff: 1 possible problem(s) in added lines. Signals, not verdicts: fix each real one.\n' +
    'A false alarm: leave the code as it is and list it in your report, one line with why.\n' +
    'app/tls.ts:7  [tls-off] TLS verification turned off -> fix the certificate or CA bundle instead (MUST 5)'
  expect(parseCheck(0, hook(report))).toEqual({
    status: 'found',
    findings: [{ line: 7, rule: 'tls-off', message: 'TLS verification turned off (MUST 5)' }],
  })
})

test('a removed safety check is read like any other finding', async () => {
  const report = 'check-diff: 1 possible problem(s) in this change. Signals, not verdicts: fix each real one.\n' +
    'A false alarm: leave the code as it is and list it in your report, one line with why.\n' +
    'api/docs.py:12  [removed-guard] access check removed and not added back -> keep it; if it is truly not needed, say why in your report (MUST 2, 5)'
  expect(parseCheck(0, hook(report))).toEqual({
    status: 'found',
    findings: [{ line: 12, rule: 'removed-guard', message: 'access check removed and not added back' }],
  })
})

test('no output is clean; a bad exit or bad output is an error', async () => {
  expect(parseCheck(0, '')).toEqual({ status: 'clean' })
  expect(parseCheck(3, '').status).toBe('error')
  expect(parseCheck(0, 'not json').status).toBe('error')
})

test('the tally counts clean and with-dangers edits, not ones still checking', async () => {
  expect(tally({ a: { status: 'clean' }, b: { status: 'found', findings: [] }, c: { status: 'checking' } }))
    .toEqual({ clean: 1, found: 1 })
})

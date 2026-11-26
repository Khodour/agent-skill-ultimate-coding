import { expect, mock, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'
import type { On } from 'claude-code'

const PANE = {
  plugin: 'agent-skill-ultimate-coding', component: 'Pane', requestId: 'uc-score', surface: 'terminal',
  props: { title: 'Ultimate Coding · session', isFocused: false, bodyColumns: 60, placement: 'dock', scroll: { offset: 0, bodyRows: 30 }, view: {} },
} as const
const ABOVE_PROMPT = {
  plugin: 'agent-skill-ultimate-coding', component: 'AbovePrompt', surface: 'terminal',
  props: { hasSurvey: false, isCollapsed: false, isWorking: false, maxRows: 10, bodyColumns: 140 },
} as const
const REPORT = '### 1. What was done\n**Confidence: High 🟢** x'

/**
 * Stands in for Claude Code. The tracker draws nothing, so its work is read where
 * it lands: the scorecard's count of finished tasks.
 */
const engine = async ($: Engine, on: On) => {
  mock.clock(on)
  on('tool.call', () => ({ result: {} }) as never)
  on('prompt.submit', (_, e) => ({ text: e.text }))
  on('turn.start', (_, e) => ({ turnId: e.turnId }) as never)
  on('session.append', (_, e, next) => next(e))
  on('command.register', () => ({ value: { command: 'uc-score' } }) as never)
  on('session.end', (_, e) => ({ sessionId: e.sessionId }) as never)
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('turn.complete', (_, e) => ({ text: e.answer }))
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  const ui = await $.ui.mount(PANE as never)
  const line = async (text: RegExp) => (await ui.find({ type: 'Text', text }))?.text
  const finished = async () => Number(/\d+/.exec((await line(/Tasks finished/)) ?? '')?.[0])
  const say = (text: string) => $.prompt.submit({ text, origin: { kind: 'composer' } } as never)
  const turn = () => $.turn.start({ turnId: 't' } as never)
  const end = (answer: string, reason = 'answer') =>
    $.turn.complete({ answer, durationMs: 1, isAborted: reason === 'aborted', turnId: 't', reason } as never)
  const skill = () => $.tool.call({ tool: 'Skill', skill: 'agent-skill-ultimate-coding:agent-skill-ultimate-coding' } as never)
  const edit = (extra: object = {}) => $.tool.call({ tool: 'Edit', file_path: '/a.py', old_string: 'a', new_string: 'b', ...extra } as never)
  const check = (extra: object = {}) => $.tool.call({ tool: 'Bash', command: 'pytest -q', ...extra } as never)
  const row = (text: string) => $.session.append({ door: 'response', uuid: 'u', origin: { kind: 'model' },
    message: { type: 'assistant', role: 'assistant', content: [{ type: 'text', text }] } } as never)
  return { ui, line, finished, say, turn, end, skill, edit, check, row }
}

test('a task is counted once, when its report comes, with the size Claude named and its confidence', async ($, on) => {
  const { ui, line, finished, skill, edit, check, end, row } = await engine($, on)
  await skill(); await row('Size: Normal\n\nThe checklist is in the task list.'); await edit(); await check()
  expect(await finished()).toBe(0)                                             // still working
  await end(REPORT)
  expect(await finished()).toBe(1)
  expect(await line(/Normal/)).toMatch(/Normal\s+█ 1/)
  expect(await line(/● High/)).toMatch(/█ 1/)
  await ui.unmount()
})

test('nothing is drawn above the prompt, while a task works or after it', async ($, on) => {
  const { ui, skill, edit, end } = await engine($, on)
  const above = await $.ui.mount(ABOVE_PROMPT as never)
  await skill(); await edit()
  expect(await above.find({ type: 'Text', text: /Ultimate Coding|working|done/ })).toBe(undefined)
  await end(REPORT)
  expect(await above.find({ type: 'Text', text: /Ultimate Coding|working|done/ })).toBe(undefined)
  await above.unmount(); await ui.unmount()
})

test('a later task that never calls the skill again is counted too', async ($, on) => {
  const { ui, finished, say, turn, end, skill, edit } = await engine($, on)
  await skill(); await edit(); await end(REPORT)
  await say('now the footer'); await turn(); await edit(); await end(REPORT)
  expect(await finished()).toBe(2)
  await ui.unmount()
})

test('a question after a task, a stopped turn and a turn with no report are not counted as tasks', async ($, on) => {
  const { ui, finished, say, turn, end, skill, edit } = await engine($, on)
  await skill(); await edit(); await end(REPORT)
  await say('what does average() return?'); await turn()
  await $.tool.call({ tool: 'Read', file_path: '/a.py' } as never)
  await end('It returns 1.5.')
  await say('add a header'); await turn(); await edit(); await end('', 'aborted')   // Esc
  await say('try again'); await turn(); await edit(); await end('I added the header.')
  expect(await finished()).toBe(1)
  await ui.unmount()
})

test('a subagent\'s work never counts before the skill was used; /clear forgets that it was', async ($, on) => {
  const { ui, finished, say, turn, end, skill, edit } = await engine($, on)
  await edit({ agentId: 'sub1' }); await end(REPORT)
  expect(await finished()).toBe(0)
  await skill(); await edit(); await end(REPORT)
  expect(await finished()).toBe(1)
  await $.session.end({ sessionId: 's', reason: 'clear' } as never)
  await say('change the title'); await turn(); await edit(); await end(REPORT)
  expect(await finished()).toBe(1)                                             // the skill is not in use in the new conversation
  await ui.unmount()
})

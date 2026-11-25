import { expect, mock, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'
import type { On } from 'claude-code'

const BAR = {
  plugin: 'agent-skill-ultimate-coding', component: 'AbovePrompt', surface: 'terminal',
  props: { hasSurvey: false, isCollapsed: false, isWorking: false, maxRows: 10, maxColumns: 140 },
} as const
const REPORT = '### 1. What was done\n**Confidence: High 🟢** x'

/** Stands in for Claude Code: answers every event the tracker raises or waits on, and gives short helpers. */
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
  const ui = await $.ui.mount(BAR as never)
  const bar = async () => (await ui.find({ type: 'Box' }))?.text ?? '(no bar)'
  const say = (text: string, origin: object = { kind: 'composer' }, extra: object = {}) =>
    $.prompt.submit({ text, origin, ...extra } as never)
  const turn = () => $.turn.start({ turnId: 't' } as never)
  const end = (answer: string, reason = 'answer') =>
    $.turn.complete({ answer, durationMs: 1, isAborted: reason === 'aborted', turnId: 't', reason } as never)
  const skill = () => $.tool.call({ tool: 'Skill', skill: 'agent-skill-ultimate-coding:agent-skill-ultimate-coding' } as never)
  const edit = (extra: object = {}) => $.tool.call({ tool: 'Edit', file_path: '/a.py', old_string: 'a', new_string: 'b', ...extra } as never)
  const check = (extra: object = {}) => $.tool.call({ tool: 'Bash', command: 'pytest -q', ...extra } as never)
  const row = (text: string) => $.session.append({ door: 'response', uuid: 'u', origin: { kind: 'model' },
    message: { type: 'assistant', role: 'assistant', content: [{ type: 'text', text }] } } as never)
  return { ui, bar, say, turn, end, skill, edit, check, row }
}

test('a task: working while it runs, then done with its checks and confidence; never a step', async ($, on) => {
  const { ui, bar, skill, edit, check, end } = await engine($, on)
  expect(await bar()).toBe('(no bar)')                                       // no skill yet: no bar
  await skill(); await edit(); await check()
  expect(await bar()).toMatch(/^Ultimate Coding [◉○] working {2}· checks 1\/1$/)
  await end(REPORT)
  expect(await bar()).toBe('Ultimate Coding ✓ done  · checks 1/1  · ● High')
  expect(await bar()).not.toMatch(/Understand|Design|Build|Verify|Report/)
  await ui.unmount()
})

test('the user\'s session: a bold-heading report that asks, then "commit and deploy", then "no its ok"', async ($, on) => {
  const { ui, bar, say, turn, end, skill, edit, check } = await engine($, on)
  await skill(); await edit(); await check()
  await end('You can now make banners.\n\n**Checks**\n- ✅ syntax\n\n**Needs attention**\n- x\n\n**Waiting for you**\n1. Commit?')
  expect(await bar()).toBe('Ultimate Coding ◌ waiting for you  · checks 1/1')
  await say('commit and deploy')
  expect(await bar()).toBe('(no bar)')                                       // fresh: nothing carried over
  await turn()
  expect(await bar()).toMatch(/[◉○] working$/)
  await $.tool.call({ tool: 'Bash', command: 'git commit -qm x && ./deploy.sh' } as never)
  await end('Committed and deployed.')
  expect(await bar()).toBe('(no bar)')                                       // no task work: just a follow-up
  await say('no its ok'); await turn(); await end('Understood.')
  expect(await bar()).toBe('(no bar)')
  await ui.unmount()
})

test('a later task that never calls the skill again shows working at once, and ends done', async ($, on) => {
  const { ui, bar, say, turn, end, skill, edit } = await engine($, on)
  await skill(); await edit(); await end(REPORT)
  await say('now add median'); await turn()
  expect(await bar()).toMatch(/[◉○] working$/)
  await edit(); await end(REPORT)
  expect(await bar()).toBe('Ultimate Coding ✓ done  · ● High')
  await ui.unmount()
})

test('a background task\'s notice, or a message typed into the running turn, keeps the bar and its checks', async ($, on) => {
  const { ui, bar, say, skill, edit, check } = await engine($, on)
  await skill(); await edit(); await check()
  await say('Background command "tests" completed (exit code 0)', { kind: 'task-notification' })
  await say('typed while it works', { kind: 'composer' }, { turnId: 't' })
  expect(await bar()).toMatch(/[◉○] working {2}· checks 1\/1$/)
  await ui.unmount()
})

test('Esc shows stopped; the reply starts a fresh working bar', async ($, on) => {
  const { ui, bar, say, turn, end, skill, edit } = await engine($, on)
  await skill(); await edit()
  await end('', 'aborted')
  expect(await bar()).toBe('Ultimate Coding ◌ stopped')
  await say('carry on'); await turn()
  expect(await bar()).toMatch(/[◉○] working$/)
  await ui.unmount()
})

test('an API error shows stopped by an error', async ($, on) => {
  const { ui, bar, end, skill, edit } = await engine($, on)
  await skill(); await edit()
  await end('', 'error')
  expect(await bar()).toBe('Ultimate Coding ✗ stopped by an error')
  await ui.unmount()
})

test('a question after a task: working while Claude answers, gone once it was only an answer', async ($, on) => {
  const { ui, bar, say, turn, end, skill, edit } = await engine($, on)
  await skill(); await edit(); await end(REPORT)
  await say('what does average return?')
  expect(await bar()).toBe('(no bar)')
  await turn()
  expect(await bar()).toMatch(/[◉○] working$/)
  await $.tool.call({ tool: 'Read', file_path: '/a.py' } as never)
  await end('It returns 1.5.')
  expect(await bar()).toBe('(no bar)')
  await ui.unmount()
})

test('a design card written as text gives the size badge', async ($, on) => {
  const { ui, bar, skill, row } = await engine($, on)
  await skill()
  await row('I will start with the card.')
  expect(await bar()).not.toMatch(/Normal/)
  await row('Design card (Normal)\n\nJob        schedule a push\nEdges      past time\nDone when  a local run passes')
  expect(await bar()).toMatch(/^Ultimate Coding Normal {2}[◉○] working$/)
  await ui.unmount()
})

test('a subagent\'s checks count; its work never opens a bar before the skill was used', async ($, on) => {
  const { ui, bar, skill, edit, check } = await engine($, on)
  await edit({ agentId: 'sub1' })
  expect(await bar()).toBe('(no bar)')
  await skill()
  await edit({ agentId: 'sub1' }); await check({ agentId: 'sub1' })
  expect(await bar()).toMatch(/[◉○] working {2}· checks 1\/1$/)
  await ui.unmount()
})

test('an async subagent: subagent working after the main turn ended, then done', async ($, on) => {
  const { ui, bar, say, turn, end, skill, edit, check } = await engine($, on)
  await skill(); await edit(); await end(REPORT)
  await say('have a subagent add last_or_none'); await turn()
  await $.tool.call({ tool: 'Agent', description: 'add last_or_none', prompt: 'x' } as never)
  await end('The subagent is working in the background; I will review its result.')
  expect(await bar()).toBe('Ultimate Coding ✓ done')
  await $.turn.start({ turnId: 'a', agentId: 'sub1' } as never)
  expect(await bar()).toMatch(/[◉○] subagent working$/)
  await say('are you done?')
  expect(await bar()).toMatch(/subagent working/)                            // a busy run is never cleared
  await edit({ agentId: 'sub1' }); await check({ agentId: 'sub1' })
  expect(await bar()).toMatch(/[◉○] subagent working {2}· checks 1\/1$/)
  await $.turn.complete({ answer: 'done', durationMs: 1, isAborted: false, turnId: 'a', reason: 'answer', agentId: 'sub1' } as never)
  expect(await bar()).toBe('Ultimate Coding ✓ done  · checks 1/1')
  await ui.unmount()
})

test('/clear forgets the run and that the skill was used', async ($, on) => {
  const { ui, bar, turn, skill, edit } = await engine($, on)
  await skill(); await edit()
  await $.session.end({ reason: 'clear', sessionId: 's1', resume: { id: 's1' } } as never)
  expect(await bar()).toBe('(no bar)')
  await turn(); await edit()
  expect(await bar()).toBe('(no bar)')                                       // the new conversation has not loaded the skill yet
  await skill()
  expect(await bar()).toMatch(/Ultimate Coding/)
  await ui.unmount()
})

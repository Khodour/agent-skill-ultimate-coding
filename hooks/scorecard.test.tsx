import { expect, mock, test } from 'claude-code/testing'

const PANE = {
  plugin: 'agent-skill-ultimate-coding', component: 'Pane', requestId: 'uc-score', surface: 'terminal',
  props: { title: 'Ultimate Coding · session', isFocused: false, bodyColumns: 60, placement: 'dock', scroll: { offset: 0, bodyRows: 30 }, view: {} },
} as const

test('a finished task shows in the scorecard; a paused one does not', async ($, on) => {
  mock.clock(on)
  on('tool.call', () => ({ result: {} }) as never)
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('turn.complete', (_, e) => ({ text: e.answer }))
  on('command.register', () => ({ value: { command: 'uc-score' } }) as never)
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })
  const end = (answer: string) =>
    $.turn.complete({ answer, durationMs: 1, isAborted: false, turnId: 't', reason: 'completed' } as never)

  const ui = await $.ui.mount(PANE as never)
  expect((await ui.find({ type: 'Text', text: /Tasks finished/ }))?.text).toBe('Tasks finished  0')

  await $.tool.call({ tool: 'Skill', skill: 'agent-skill-ultimate-coding:agent-skill-ultimate-coding' } as never)
  await $.tool.call({ tool: 'Write', file_path: '/a.js', content: 'x' } as never)
  await end('### 1. What was done\n### 3. Waiting for you\n1. Which one?')
  expect((await ui.find({ type: 'Text', text: /Tasks finished/ }))?.text).toBe('Tasks finished  0')

  await $.tool.call({ tool: 'Bash', command: 'npm test' } as never)
  await end('### 1. What was done\n**Confidence: Medium 🟡** demo')
  expect((await ui.find({ type: 'Text', text: /Tasks finished/ }))?.text).toBe('Tasks finished  1')
  expect((await ui.find({ type: 'Text', text: /Checks/ }))?.text).toContain('1 passed')
  await ui.unmount()
})

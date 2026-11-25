import { expect, mock, test } from 'claude-code/testing'

const BAR = {
  plugin: 'agent-skill-ultimate-coding', component: 'AbovePrompt', surface: 'terminal',
  props: { hasSurvey: false, isCollapsed: false, isWorking: false, maxRows: 10, maxColumns: 140 },
} as const

test('the bar follows a skill task from its start to its report', async ($, on) => {
  mock.clock(on)
  on('tool.call', () => ({ result: {} }) as never)
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('turn.complete', (_, e) => ({ text: e.answer }))
  await $.session.start({ cwd: '/', surface: 'terminal', isInteractive: true })

  const ui = await $.ui.mount(BAR as never)
  expect(await ui.find({ type: 'Text', text: /Ultimate Coding/ })).toBe(undefined)   // no skill yet: no bar

  await $.tool.call({ tool: 'Skill', skill: 'agent-skill-ultimate-coding:agent-skill-ultimate-coding' } as never)
  await $.tool.call({ tool: 'Write', file_path: '/a.js', content: 'x' } as never)
  await $.tool.call({ tool: 'Bash', command: 'npm test' } as never)
  expect((await ui.find({ type: 'Text', text: /checks/ }))?.text).toContain('checks 1/1')

  await $.turn.complete({ answer: '### 1. What was done\n**Confidence: High 🟢** all ran', durationMs: 1000, isAborted: false, turnId: 't', reason: 'completed' } as never)
  expect((await ui.find({ type: 'Text', text: /Report/ }))?.text).toContain('✓ Report')
  expect((await ui.find({ type: 'Text', text: /High/ }))?.text).toContain('● High')
  await ui.unmount()
})

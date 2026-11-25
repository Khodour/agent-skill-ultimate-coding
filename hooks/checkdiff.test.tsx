import { expect, mock, test } from 'claude-code/testing'

const PANE = {
  plugin: 'agent-skill-ultimate-coding', component: 'Pane', requestId: 'uc-score', surface: 'terminal',
  props: { title: 'Ultimate Coding · session', isFocused: false, bodyColumns: 60, placement: 'dock', scroll: { offset: 0, bodyRows: 30 }, view: {} },
} as const

test("each edit runs the plugin's own check-diff, and the scorecard counts the verdicts", async ($, on) => {
  mock.clock(on)
  const runs: string[][] = []
  const clean = { exitCode: 0, stdout: '', stderr: '' }
  const danger = { exitCode: 0, stderr: '', stdout: JSON.stringify({ hookSpecificOutput: { additionalContext: 'x.js:3  [tls-off] TLS verification turned off -> fix it (MUST 5)' } }) }
  on('process.run', (_, e) => {
    runs.push([...(e as unknown as { argv: string[] }).argv])
    return { value: runs.length === 1 ? clean : danger } as never
  })
  on('session.cwd', () => ({ value: '/project' }) as never)
  on('tool.call', () => ({ result: {} }) as never)

  await $.tool.call({ tool: 'Write', file_path: '/project/a.js', content: 'x' } as never)
  await $.tool.call({ tool: 'Edit', file_path: '/project/x.js', old_string: 'a', new_string: 'b' } as never)
  await $.tool.call({ tool: 'Read', file_path: '/project/a.js' } as never)

  expect(runs.length).toBe(2)
  expect(runs[0]?.[0]).toBe('bash')
  expect(runs[0]?.[1]).toMatch(/skills\/agent-skill-ultimate-coding\/scripts\/check-diff\.sh$/)
  expect(runs[0]?.[2]).toBe('--hook')

  const ui = await $.ui.mount(PANE as never)
  expect((await ui.find({ type: 'Text', text: /check-diff/ }))?.text).toBe('  check-diff 1 clean · 1 with dangers')
  await ui.unmount()
})

test("the line is drawn under Claude Code's own row, which stays", async ($, on) => {
  mock.clock(on)
  on('process.run', () => ({ value: { exitCode: 0, stdout: '', stderr: '' } }) as never)
  on('session.cwd', () => ({ value: '/project' }) as never)
  let id = ''
  on('tool.call', (_, e) => {
    id = e.tool_use_id
    return { result: {} } as never
  })
  // A hook here stands for Claude Code drawing its own row.
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine row</Text>
  })
  await $.tool.call({ tool: 'Write', file_path: '/project/a.js', content: 'x' } as never)

  const ui = await $.ui.mount({
    plugin: 'agent-skill-ultimate-coding', component: 'ToolUse', requestId: id, surface: 'terminal',
    props: { tool_use_id: id, tool: 'Write', input: {}, isRunning: false, isErrored: false, isInterrupted: false },
  } as never)
  expect((await ui.find({ type: 'Text', text: /engine row/ }))?.text).toBe('engine row')
  expect((await ui.find({ type: 'Text', text: /check-diff/ }))?.text).toBe('  ↳ check-diff: clean')
  await ui.unmount()
})

import { expect, mock, test } from 'claude-code/testing'
import type { On } from 'claude-code'
import type { Engine } from 'claude-code/testing'

const ALL_OFF = { checklist: false, scorecard: false, checkDiffLine: false }
const SKILL = { tool: 'Skill', skill: 'agent-skill-ultimate-coding:agent-skill-ultimate-coding' }

/** Stands in for Claude Code and records what the plugin asked it to do. */
const engine = (on: On) => {
  const seen = { commands: [] as string[], tools: [] as string[], processes: 0 }
  mock.clock(on)
  on('command.register', (_, e) => { seen.commands.push(String((e as { name?: unknown }).name)); return { value: { command: 'x' } } as never })
  on('tool.register', (_, e) => { seen.tools.push(String((e as { name?: unknown }).name)); return { value: { tool: 'x' } } as never })
  on('process.run', () => { seen.processes += 1; return { value: { exitCode: 0, stdout: '', stderr: '' } } as never })
  on('session.cwd', () => ({ value: '/p' }) as never)
  on('tool.call', () => ({ result: {} }) as never)
  on('skill.prompt', (_, e) => ({ text: e.text }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  return seen
}
const work = async ($: Engine) => {
  await $.session.start({ cwd: '/p', surface: 'terminal', isInteractive: true })
  await $.skill.prompt({ skill: 'agent-skill-ultimate-coding:agent-skill-ultimate-coding', text: 'x', frontmatter: {} })
  await $.tool.call(SKILL as never)
  return (await $.tool.call({ tool: 'Edit', file_path: '/p/src/refund.ts', old_string: 'a', new_string: 'const refund = amount' } as never)) as { deny?: string }
}

test('with every switch on (the default), every feature acts', async ($, on) => {
  const seen = engine(on)
  const edit = await work($)
  expect(seen.commands).toEqual(['uc-score'])
  // Only the checklist tool is added, and no edit is held, even one about money: Claude decides the task's size.
  expect(seen.tools).toEqual(['checklist'])
  expect(edit.deny).toBe(undefined)
  expect(seen.processes).toBe(1)                                               // check-diff ran on the edit
})

test('with every switch off, nothing extra runs', { options: ALL_OFF }, async ($, on) => {
  const seen = engine(on)
  const edit = await work($)
  expect([seen.commands.length, seen.tools.length, seen.processes]).toEqual([0, 0, 0])
  expect(edit.deny).toBe(undefined)
})

test('one switch off leaves the others on', { options: { scorecard: false } }, async ($, on) => {
  const seen = engine(on)
  await work($)
  expect(seen.commands).toEqual([])                                            // the scorecard's command is gone
  expect(seen.processes).toBe(1)                                               // check-diff still ran
})

test('the checklist switch off: no checklist tool, so Claude falls back to its own task list or a numbered list', { options: { checklist: false } }, async ($, on) => {
  const seen = engine(on)
  await work($)
  expect(seen.tools).toEqual([])
  expect(seen.commands).toEqual(['uc-score'])                                 // the other features stay on
  expect(seen.processes).toBe(1)
})

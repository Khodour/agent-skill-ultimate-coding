import { expect, mock, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'
import type { On } from 'claude-code'

/** Stands in for Claude Code, with a project whose rules files are given by path. */
const engine = async ($: Engine, on: On, files: Record<string, string> = {}) => {
  mock.clock(on)
  on('tool.call', () => ({ result: {} }) as never)
  on('prompt.submit', (_, e) => ({ text: e.text }))
  on('command.register', () => ({ value: { command: 'uc-score' } }) as never)
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('session.cwd', () => ({ value: '/home/me/shop' }) as never)
  on('env.get', (_, e) => ({ value: (e as { name: string }).name === 'HOME' ? '/home/me' : undefined }) as never)
  on('fs.read', (_, e) => {
    const path = (e as { path: string }).path
    if (path in files) return { value: files[path] } as never
    throw new Error(`ENOENT: ${path}`)
  })
  on('classic.Stop', () => ({}) as never)
  await $.session.start({ cwd: '/home/me/shop', surface: 'terminal', isInteractive: true })
  const skill = () => $.tool.call({ tool: 'Skill', skill: 'agent-skill-ultimate-coding:agent-skill-ultimate-coding' } as never)
  const write = (lines: number) => $.tool.call({ tool: 'Write', file_path: '/home/me/shop/a.py', content: Array(lines).fill('x').join('\n') } as never)
  const stop = (message: string, extra: object = {}) =>
    $.classic.Stop({ stop_hook_active: false, last_assistant_message: message, ...extra } as never) as Promise<{ block?: string }>
  const say = (text: string) => $.prompt.submit({ text, origin: { kind: 'composer' } } as never)
  return { skill, write, stop, say }
}

test('a coding turn that stops without the report is sent back once, then allowed to stop', async ($, on) => {
  const { skill, write, stop } = await engine($, on)
  await skill(); await write(20)
  expect((await stop('I built it and the tests pass.')).block).toMatch(/Ultimate Coding report/)
  expect((await stop('I built it and the tests pass.', { stop_hook_active: true })).block).toBe(undefined)
  expect((await stop('### 1. What was done\n**Confidence: High 🟢** x')).block).toBe(undefined)
})

test('no nudge after a question-only turn, a trivial edit, or while background work runs', async ($, on) => {
  const { skill, write, stop, say } = await engine($, on)
  await skill()
  expect((await stop('average returns 1.5.')).block).toBe(undefined)                  // no code changed
  await write(2)
  expect((await stop('Fixed the typo.')).block).toBe(undefined)                       // trivial
  await write(30)
  expect((await stop('Tests are running in the background.', { background_tasks: [{ id: 'b1' }] })).block).toBe(undefined)
  await say('thanks, what next?')                                                     // the person's new message: a new count
  expect((await stop('Nothing else is open.')).block).toBe(undefined)
})

test('no nudge when the skill was not used in this conversation', async ($, on) => {
  const { write, stop } = await engine($, on)
  await write(50)
  expect((await stop('Done.')).block).toBe(undefined)
})

test('the project\'s own report format wins: its CLAUDE.md, or one in a parent folder, silences the check', async ($, on) => {
  const { skill, write, stop } = await engine($, on, { '/home/me/CLAUDE.md': 'Final message: three bullets.' })
  await skill(); await write(20)
  expect((await stop('Done.')).block).toMatch(/report/)                               // the home folder's file is not the project's
})

test('a parent project folder that sets its own format silences the check', async ($, on) => {
  const { skill, write, stop } = await engine($, on, { '/home/me/shop/AGENTS.md': '## Reporting\nUse this report format: Done / Next / Risks.' })
  await skill(); await write(20)
  expect((await stop('Done.')).block).toBe(undefined)
})

test('the person asking for a one-line reply is never nudged for the report', async ($, on) => {
  const { skill, write, stop, say } = await engine($, on)
  await skill()
  await say('Add product(xs) and run the test. When done, reply with ONE line only, no report.')
  await write(20)
  expect((await stop('Added product(xs); all 14 tests pass.')).block).toBe(undefined)
  await say('Now add mode(xs) with tests.')                                         // a new ordinary request: the check is back
  await write(20)
  expect((await stop('Added mode(xs).')).block).toMatch(/report/)
})

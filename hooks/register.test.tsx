import { expect, test } from 'claude-code/testing'

test('a toast shows when the skill loads, and only for this skill', async ($, on) => {
  const toasts: string[] = []
  on('ui.toast', (_, e) => { toasts.push(e.text); return { value: undefined } })
  on('skill.prompt', (_, e) => ({ text: e.text }))

  await $.skill.prompt({ skill: 'agent-skill-ultimate-coding:agent-skill-ultimate-coding', text: 'x', frontmatter: {} })
  await $.skill.prompt({ skill: 'some-other-skill', text: 'x', frontmatter: {} })
  await $.skill.prompt({ skill: 'agent-skill-ultimate-coding:agent-skill-ultimate-coding', text: 'x', frontmatter: {} })

  expect(toasts).toEqual(['Ultimate Coding loaded', 'Ultimate Coding loaded'])
})

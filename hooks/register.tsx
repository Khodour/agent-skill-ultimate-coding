/**
 * Claude Code hooks module for agent-skill-ultimate-coding: shows a toast when
 * the skill loads, so the person can see it is active. Claude Code versions
 * without hooks modules never load this file; the command hooks in hooks.json
 * run either way.
 */
import type { Register } from 'claude-code'

const SKILL = 'agent-skill-ultimate-coding'

export const register: Register = on => {
  on('skill.prompt', async ($, e, next) => {
    const result = await next(e)
    if (e.skill.includes(SKILL)) $.ui.toast('Ultimate Coding loaded', { timeoutMs: 5000 })
    return result
  })
}

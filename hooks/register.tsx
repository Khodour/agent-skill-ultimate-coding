/**
 * Claude Code hooks module for agent-skill-ultimate-coding. A plugin may hook
 * an event only once (unless each hook has its own matcher), so the shared
 * events are hooked here, once, and call each feature in a fixed order. Each
 * feature lives in its own file. Claude Code versions without hooks modules
 * never load this file; the command hooks in hooks.json run either way.
 */
import type { PluginOptions, Register } from 'claude-code'

import { CHECKLIST_TOOL } from './checklist'
import { checklistRow, checklistViewStart, registerChecklistView } from './checklist-view'
import { classifyPrompt, turnEnd } from './progress'
import {
  trackerAgent, trackerChecklist, trackerPrompt, trackerRegisterTool, trackerRow, trackerSessionEnd, trackerSkill, trackerTool,
  trackerTurnEnd, trackerTurnStart,
} from './tracker'

const SKILL = 'agent-skill-ultimate-coding'

/** Which features are on: the userConfig switches in plugin.json, each on unless set to false. */
const featuresFrom = (options: PluginOptions) => ({
  checklist: options.checklist !== false,
  checklistTimer: options.checklistTimer !== false,
})

export const register: Register = (on, options) => {
  const features = featuresFrom(options)
  on('session.start', async ($, e, next) => {
    if (features.checklist) {                        // the checklist tool, which the skill asks for on every task
      await trackerRegisterTool($)
      checklistViewStart($, features.checklistTimer)
    }
    return next(e)
  })

  // Only the person's own new message ends a finished task; a background task's notice,
  // a message typed into the running turn, or a slash command leaves the run alone.
  on('prompt.submit', async ($, e, next) => {
    const kind = classifyPrompt(e)
    await trackerPrompt($, kind)
    return next(e)
  }).catch(($, e, next) => next(e))

  // A main-loop turn starting: a waiting or stopped run works again, or a tentative one shows at once.
  // A subagent's turn starting: the run is busy while it works, even after the main turn ended.
  on('turn.start', async ($, e, next) => {
    if (e.agentId === undefined) await trackerTurnStart($)
    else await trackerAgent($, e.agentId, true)
    return next(e)
  }).catch(($, e, next) => next(e))

  // Each row the main conversation stores: a checklist written as text in Claude's reply still counts.
  on('session.append', async ($, e, next) => {
    const stored = await next(e)
    if (e.agentId === undefined && e.door === 'response' && e.message.type === 'assistant') {
      const text = e.message.content.map(b => (b.type === 'text' ? b.text : '')).join('\n')
      // The row is already stored; a tracker failure must not touch it, so it goes to the debug log.
      if (text !== '') await trackerRow($, text).catch(err => $.ui.log(`run tracker: size-in-text failed: ${String(err)}`, { to: 'debug' }))
    }
    return stored
  })

  // /clear and a resume end the conversation without a new session.start: forget its run.
  on('session.end', async ($, e, next) => {
    if (e.reason === 'clear' || e.reason === 'resume') {
      await trackerSessionEnd($)
    }
    return next(e)
  }).catch(($, e, next) => next(e))

  // The skill starting a task: Claude Code may send skill.prompt, a Skill tool call, or both; either opens the run.
  on('skill.prompt', async ($, e, next) => {
    if (e.skill.includes(SKILL)) await trackerSkill($)
    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    const isMain = e.agentId === undefined
    // Claude calls the Skill tool even when the skill is already loaded and no skill.prompt follows.
    if (isMain && e.tool === 'Skill' && String(e.skill).includes(SKILL)) await trackerSkill($)
    // No call is held here: Claude decides the task's size, no rule in this code does. The plugin's
    // own checklist tool is answered here, before Claude Code's permission check: it only records the
    // list, and a question nobody can answer (claude -p, evals) would otherwise stop it. The engine's
    // types know only built-in and connected tools, so the plugin's answer is cast to their result type.
    const ran = features.checklist && (e.tool as string) === CHECKLIST_TOOL
      ? ((await trackerChecklist($, e)) as unknown as Awaited<ReturnType<typeof next>>)
      : await next(e)
    if (isMain) {
      await trackerTool($, e.tool, e, ran)
    } else {
      await trackerTool($, e.tool, e, ran, true)       // a subagent's edits and checks move the run it works for
    }
    return ran
  }).catch(($, e, next) => next(e))   // if this hook fails, the call goes ahead

  on('turn.complete', async ($, e, next) => {
    if (e.agentId === undefined) {
      await trackerTurnEnd($, e.answer, turnEnd(e.reason))
    } else {
      await trackerAgent($, e.agentId, false)            // a subagent's run ended (an aborted one too)
    }
    return next(e)
  })

  // The checklist tool's row is one short line; ctrl+o (expanded) still shows the full call.
  on('ui.render', { component: 'ToolUse' }, async ($, e, next) => {
    if (features.checklist && e.props.tool === CHECKLIST_TOOL && e.props.isExpanded !== true) return checklistRow($, e.props.input, $.ui.resolve(e))
    return next(e)
  })

  if (features.checklist) registerChecklistView(on, features.checklistTimer)
}

/**
 * Claude Code hooks module for agent-skill-ultimate-coding. A plugin may hook
 * an event only once (unless each hook has its own matcher), so the shared
 * events are hooked here, once, and call each feature in a fixed order. Each
 * feature lives in its own file. Claude Code versions without hooks modules
 * never load this file; the command hooks in hooks.json run either way.
 */
import type { PluginOptions, Register } from 'claude-code'

import { checkdiffTool, checkdiffUnderRow } from './checkdiff'
import { CARD_TOOL, classifyPrompt, turnEnd } from './progress'
import { gateCardRun, gateCheck, gatePrompt, gateReset, gateStart, gateTurnEnd, gateUnderRow } from './gate'
import { reportPrompt, reportReset, reportStop, reportTool } from './report'
import { registerScorecardViews, scorecardStart, scorecardTool, scorecardTurnEnd } from './scorecard'
import {
  registerTrackerViews, trackerAgent, trackerPrompt, trackerRow, trackerSessionEnd, trackerSkill, trackerStart, trackerTool,
  trackerTurnEnd, trackerTurnStart,
} from './tracker'

const SKILL = 'agent-skill-ultimate-coding'

/** Which features are on: the userConfig switches in plugin.json, each on unless set to false. */
const featuresFrom = (options: PluginOptions) => ({
  tracker: options.progressTracker !== false,
  scorecard: options.scorecard !== false,
  checkDiff: options.checkDiffLine !== false,
  gate: options.designCardGate !== false,
  report: options.reportCheck !== false,
})

export const register: Register = (on, options) => {
  const features = featuresFrom(options)
  on('session.start', async ($, e, next) => {
    if (features.tracker) trackerStart($)
    if (features.scorecard) await scorecardStart($)
    if (features.gate) await gateStart($)
    return next(e)
  })

  // Only the person's own new message ends a finished task; a background task's notice,
  // a message typed into the running turn, or a slash command leaves the run alone.
  on('prompt.submit', async ($, e, next) => {
    const kind = classifyPrompt(e)
    await trackerPrompt($, kind)
    if (features.report) await reportPrompt($, kind, e.text)
    if (features.gate) await gatePrompt($, e.text)
    return next(e)
  }).catch(($, e, next) => next(e))

  // A main-loop turn starting: a waiting or stopped run works again, or a tentative one shows at once.
  // A subagent's turn starting: the run is busy while it works, even after the main turn ended.
  on('turn.start', async ($, e, next) => {
    if (e.agentId === undefined) await trackerTurnStart($)
    else await trackerAgent($, e.agentId, true)
    return next(e)
  }).catch(($, e, next) => next(e))

  // Each row the main conversation stores: a design card Claude wrote as text still counts.
  on('session.append', async ($, e, next) => {
    const stored = await next(e)
    if (e.agentId === undefined && e.door === 'response' && e.message.type === 'assistant') {
      const text = e.message.content.map(b => (b.type === 'text' ? b.text : '')).join('\n')
      // The row is already stored; a tracker failure must not touch it, so it goes to the debug log.
      if (text !== '') await trackerRow($, text).catch(err => $.ui.log(`progress bar: card-in-text failed: ${String(err)}`, { to: 'debug' }))
    }
    return stored
  })

  // /clear and a resume end the conversation without a new session.start: forget its run and card.
  on('session.end', async ($, e, next) => {
    if (e.reason === 'clear' || e.reason === 'resume') {
      await trackerSessionEnd($)
      await reportReset($)
      if (features.gate) await gateReset($)
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
    // The design-card gate: an edit into a Complex area waits for a card that covers it.
    const wait = isMain && features.gate ? await gateCheck($, e.tool, e) : null
    if (wait !== null) return { deny: wait }
    // design_card is answered here, before Claude Code's permission check: it only records the card,
    // and a check nobody can answer (claude -p, evals) would otherwise hold every Complex edit forever.
    const ran = e.tool === CARD_TOOL
      ? (features.gate ? await gateCardRun($, e.tool_use_id, e) : { deny: 'design_card is switched off in /config.' })
      : await next(e)
    if (isMain) {
      await trackerTool($, e.tool, e, ran)
      await scorecardTool($, e.tool, e, ran)
      if (features.checkDiff) await checkdiffTool($, e.tool, e.tool_use_id, e, ran)
      if (features.report) await reportTool($, e.tool, e, ran)
    } else {
      await trackerTool($, e.tool, e, ran, true)       // a subagent's edits and checks move the run it works for
    }
    return ran
  }).catch(($, e, next) => next(e))   // the gate enforces a habit: if this hook fails, the call goes ahead

  on('turn.complete', async ($, e, next) => {
    if (e.agentId === undefined) {
      const { before, after } = await trackerTurnEnd($, e.answer, turnEnd(e.reason))
      await scorecardTurnEnd($, before, after)
      if (features.gate) await gateTurnEnd($, e.answer)
    } else {
      await trackerAgent($, e.agentId, false)            // a subagent's run ended (an aborted one too)
    }
    return next(e)
  })

  // Claude about to stop: after a turn that changed code, one nudge to end with the skill's report
  // and Confidence line, unless the project's own rules set a format of their own.
  on('classic.Stop', async ($, e, next) => {
    const result = await next(e)
    if (!features.report) return result
    const nudge = await reportStop($, e)
    return nudge === null ? result : { ...result, block: nudge }
  }).catch(($, e, next) => next(e))   // a failing check never keeps Claude from stopping

  // Under a tool's row: one hook for every feature that draws there, stacked in order.
  on('ui.render', { component: 'ToolUse' }, async ($, e, next) => {
    if (e.props.isRunning) return next(e)
    const { Box, Text } = $.ui.resolve(e)
    const under = [
      features.checkDiff ? await checkdiffUnderRow($, e.props.tool, e.props.tool_use_id, { Box, Text }) : null,
      features.gate ? await gateUnderRow($, e.props.tool, e.props.tool_use_id, { Box, Text }) : null,
    ].filter(x => x !== null)
    if (under.length === 0) return next(e)
    return (
      <Box flexDirection="column">
        {await next(e)}
        {under}
      </Box>
    )
  })

  if (features.tracker) registerTrackerViews(on)
  if (features.scorecard) registerScorecardViews(on)
}

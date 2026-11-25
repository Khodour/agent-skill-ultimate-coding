/**
 * Claude Code hooks module for agent-skill-ultimate-coding. A plugin may hook
 * an event only once (unless each hook has its own matcher), so the shared
 * events are hooked here, once, and call each feature in a fixed order. Each
 * feature lives in its own file. Claude Code versions without hooks modules
 * never load this file; the command hooks in hooks.json run either way.
 */
import type { PluginOptions, Register } from 'claude-code'

import { checkdiffTool, checkdiffUnderRow } from './checkdiff'
import { CARD_TOOL } from './progress'
import { gateCardRun, gateCheck, gatePrompt, gateStart, gateTurnEnd, gateUnderRow } from './gate'
import { registerScorecardViews, scorecardStart, scorecardTool, scorecardTurnEnd } from './scorecard'
import { registerTrackerViews, trackerPrompt, trackerSkill, trackerStart, trackerTool, trackerTurnEnd } from './tracker'

const SKILL = 'agent-skill-ultimate-coding'

/** Which features are on: the userConfig switches in plugin.json, each on unless set to false. */
const featuresFrom = (options: PluginOptions) => ({
  tracker: options.progressTracker !== false,
  scorecard: options.scorecard !== false,
  checkDiff: options.checkDiffLine !== false,
  gate: options.designCardGate !== false,
})

export const register: Register = (on, options) => {
  const features = featuresFrom(options)
  on('session.start', async ($, e, next) => {
    if (features.tracker) trackerStart($)
    if (features.scorecard) await scorecardStart($)
    if (features.gate) await gateStart($)
    return next(e)
  })

  on('prompt.submit', async ($, e, next) => {
    await trackerPrompt($)
    if (features.gate) await gatePrompt($, e.text)
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
    }
    return ran
  }).catch(($, e, next) => next(e))   // the gate enforces a habit: if this hook fails, the call goes ahead

  on('turn.complete', async ($, e, next) => {
    if (e.agentId === undefined) {
      const { before, after } = await trackerTurnEnd($, e.answer)
      await scorecardTurnEnd($, before, after)
      if (features.gate) await gateTurnEnd($, e.answer)
    }
    return next(e)
  })

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

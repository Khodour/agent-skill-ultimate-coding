/**
 * Feature: the progress tracker. A bar above the prompt shows only what Claude
 * Code's events make certain: working, subagent working, stopped, waiting for you
 * or done, with the task size (when Claude names it), the checks run and the
 * report's confidence. It never guesses which step of the skill Claude is on.
 *
 * Its state lives in host-held atoms, so a hot reload of this code keeps it; only
 * the blink timer dies with a reload, and the working dot is then drawn solid.
 */
import { atom, read, update } from 'claude-code'
import type { EngineInterface, On } from 'claude-code'

import type { PromptKind, Run } from '../types'
import {
  barState, hasAgents, isTaskWork, onAgent, onAnswer, onPrompt, onSize, onTool, onTurnStart, sizeInText, startRun,
} from './progress'
import type { TurnEnd } from './progress'

const SKILL = 'agent-skill-ultimate-coding'
const run = atom({ plugin: 'agent-skill-ultimate-coding', key: 'run' } as const, null)
const skillUsed = atom({ plugin: 'agent-skill-ultimate-coding', key: 'skillUsed' } as const, false)
const pulse = atom({ plugin: 'agent-skill-ultimate-coding', key: 'pulse' } as const, { on: false, at: 0 })
/** A blink older than this means its timer died (a hot reload): draw the working dot solid. */
const STALE_MS = 2000

/** One quiet colour per size, so the badge reads at a glance. */
export const SIZE_COLOR = { Trivial: '#9ca3af', Small: '#67e8f9', Normal: '#93c5fd', Complex: '#f0abfc' } as const
/** Confidence as a small one-cell dot, coloured. */
export const CONF_COLOR = { High: '#4ade80', Medium: '#fbbf24', Low: '#f87171' } as const

/** Applies `fn` to the run, if one is active. */
function change($: EngineInterface, fn: (r: Run) => Run) {
  return update($, run, r => (r === null ? r : fn(r)))
}

/** Session start (and a reload that re-runs it): the blink clock. A timer started inside one hook stops when that hook returns, so it lives here. */
export function trackerStart($: EngineInterface): void {
  $.clock.every(500, () => {
    void read($, run).then(async r => {
      if (r !== null && (!r.isDone || hasAgents(r))) {
        const at = await $.clock.now()
        await update($, pulse, p => ({ on: !p.on, at }))
      }
    })
  })
}

/**
 * Whether the skill was loaded in this conversation. The atom says so once the
 * skill was called here; when it is empty (a resumed conversation, a state that
 * was lost) the conversation itself is read once for the skill's tool call.
 */
async function wasSkillUsed($: EngineInterface): Promise<boolean> {
  if (await read($, skillUsed)) return true
  try {
    const rows = await $.session.messages()
    const found = rows.some(m => m.toolUses.some(t => t.tool === 'Skill' && String(t.input.skill ?? '').includes(SKILL)))
    if (found) await update($, skillUsed, () => true)
    return found
  } catch {
    return false
  }
}

/** A submitted prompt: the person's new message clears a finished run; everything else leaves it. */
export function trackerPrompt($: EngineInterface, kind: PromptKind) {
  return update($, run, r => onPrompt(r, kind))
}

/** The skill is in use this turn: start a run, or carry on the open one. */
export async function trackerSkill($: EngineInterface) {
  await update($, skillUsed, () => true)
  return update($, run, r => {
    if (r === null) return startRun()
    const { isTentative: _, ...real } = r              // the skill loading makes a tentative run a real task
    return real
  })
}

/**
 * A main-loop turn started. A stopped or waiting run is working again; with no
 * run, but the skill used in this conversation, a tentative run shows at once at
 * Understand, so the bar never sits empty while Claude works (it is dropped at the
 * turn's end if the turn was only a question).
 */
export async function trackerTurnStart($: EngineInterface) {
  const r = await read($, run)
  if (r !== null) return update($, run, () => onTurnStart(r))
  if (await wasSkillUsed($)) await update($, run, cur => cur ?? startRun(true))
}

/**
 * A finished tool call, of the main loop or a subagent. Claude loads the skill
 * once per session, so a later task never calls it again: once the skill was
 * used, that task's first real step (a checklist item, an edit, a check, work handed to a
 * subagent) opens its run. A subagent's edits and checks move the run it works
 * for, and open one when the main loop handed off without one (an async agent).
 */
export async function trackerTool($: EngineInterface, tool: string, input: unknown, ran: { deny?: string; isError?: boolean }, isSubagent = false) {
  if (ran.deny !== undefined) return
  const raw = tool === 'Bash' ? (input as { command?: unknown }).command : undefined
  const command = typeof raw === 'string' ? raw : undefined
  // A failing check still counts (a bug fix starts with a failing test); a failed edit does not.
  if ((tool === 'Bash' || ran.isError !== true) && isTaskWork(tool, command) && (await wasSkillUsed($))) {
    // A check alone opens a tentative run; a checklist item, an edit or a hand-off, a real one; a subagent's work is always real.
    await update($, run, r => r ?? startRun(tool === 'Bash' && !isSubagent))
  }
  await change($, r => onTool(r, tool, command, ran.isError === true))
}

/** A subagent's loop started or ended (its own turn.start / turn.complete): the run is busy while one works. */
export async function trackerAgent($: EngineInterface, agentId: string, isRunning: boolean) {
  await change($, r => onAgent(r, agentId, isRunning))
}

/**
 * A row the main conversation stores. A line in Claude's reply that names the
 * task's size ("Size: Normal") makes the run a task and gives the size badge.
 */
export async function trackerRow($: EngineInterface, text: string) {
  const size = sizeInText(text)
  if (size === null || !(await wasSkillUsed($))) return
  await update($, run, r => onSize(r ?? startRun(), size))
}

/** The turn ended: report, confidence, paused, stopped or finished. Returns the run before and after, for the scorecard. */
export async function trackerTurnEnd($: EngineInterface, answer: string, end: TurnEnd = 'answer'): Promise<{ before: Run | null; after: Run | null }> {
  const before = await read($, run)
  const after = before === null ? null : onAnswer(before, answer, end)
  await update($, run, () => after)
  return { before, after }
}

/** The conversation ended (/clear, a resume): its run and the memory that the skill was used go with it. */
export async function trackerSessionEnd($: EngineInterface) {
  await update($, run, () => null)
  await update($, skillUsed, () => false)
}

/** How each state is drawn: its mark, its colour, and whether the mark blinks. */
const LOOK: Record<string, { mark: string; color: string; blinks?: true }> = {
  'working': { mark: '◉', color: '#fbbf24', blinks: true },
  'subagent working': { mark: '◉', color: '#93c5fd', blinks: true },
  'waiting for you': { mark: '◌', color: '#fbbf24' },
  'done': { mark: '✓', color: '#4ade80' },
  'stopped': { mark: '◌', color: '#9ca3af' },
  'stopped by an error': { mark: '✗', color: '#f87171' },
}

/** Adds the tracker's drawing hook: the bar above the prompt, with its own component matcher. */
export const registerTrackerViews = (on: On): void => {
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const r = await read($, run)
    if (e.props.hasSurvey || r === null) return next(e)
    const { Box, Text } = $.ui.resolve(e)
    const state = barState(r)
    const look = LOOK[state] ?? { mark: '•', color: '#9ca3af' }
    const p = await read($, pulse)
    const now = await $.clock.now().catch(() => p.at)
    const isLit = look.blinks !== true || p.on || now - p.at > STALE_MS     // a dead blink timer draws the dot solid
    return (
      <Box>
        <Text color="#4ade80">Ultimate Coding </Text>
        {r.size !== undefined && (
          <Text>
            <Text color={SIZE_COLOR[r.size]} bold>{r.size}</Text>
            <Text dimColor>{'  '}</Text>
          </Text>
        )}
        <Text color={look.color}>{isLit ? look.mark : '○'} {state}</Text>
        {r.checks > 0 && <Text dimColor>{`  · checks ${r.checks - r.failed}/${r.checks}`}</Text>}
        {r.isDone && r.confidence !== null && (
          <Text>
            <Text dimColor>{'  · '}</Text>
            <Text color={CONF_COLOR[r.confidence]}>● {r.confidence}</Text>
          </Text>
        )}
      </Box>
    )
  })
}

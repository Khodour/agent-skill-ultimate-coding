/**
 * Feature: the run tracker. It follows one task from the person's message to
 * the end of its turn: the size Claude named, the checks run, how the turn
 * ended and the report's confidence. The scorecard counts finished tasks from
 * it, and the report check asks it whether the skill is in use. It also answers
 * the checklist tool: the list lives on the run, so it belongs to its task.
 *
 * Its state lives in host-held atoms, so a hot reload of this code keeps it.
 */
import { atom, read, update } from 'claude-code'
import type { EngineInterface } from 'claude-code'

import type { PromptKind, Run } from '../types'
import {
  isTaskWork, onAgent, onAnswer, onPrompt, onSize, onTool, onTurnStart, sizeInText, startRun,
} from './progress'
import type { TurnEnd } from './progress'
import { TOOL_DESCRIPTION, TOOL_NAME, TOOL_SCHEMA, applyChecklist, checklistReply } from './checklist'

const SKILL = 'agent-skill-ultimate-coding'
const run = atom({ plugin: 'agent-skill-ultimate-coding', key: 'run' } as const, null)
const skillUsed = atom({ plugin: 'agent-skill-ultimate-coding', key: 'skillUsed' } as const, false)
/** Applies `fn` to the run, if one is active. */
function change($: EngineInterface, fn: (r: Run) => Run) {
  return update($, run, r => (r === null ? r : fn(r)))
}

/** Session start: the checklist tool, in the prompt's tool list from the first turn. */
export async function trackerRegisterTool($: EngineInterface): Promise<void> {
  await $.tool.register({ name: TOOL_NAME, description: TOOL_DESCRIPTION, inputSchema: TOOL_SCHEMA, isDeferred: false })
}

/**
 * The checklist tool itself, answered by the plugin: it writes or ticks the
 * task's list, opens the run (the skill is at work), takes the size Claude chose,
 * and tells Claude where the list stands. It records only; it never blocks.
 */
export async function trackerChecklist($: EngineInterface, input: unknown): Promise<{ result: string; isError: false }> {
  const fields = (input ?? {}) as Record<string, unknown>
  await update($, skillUsed, () => true)
  let reply = ''
  await update($, run, r => {
    const open = onSize(r ?? startRun(), fields.size)
    const list = applyChecklist(open.list, fields)
    reply = checklistReply(list)
    return { ...open, list }
  })
  return { result: reply, isError: false }
}

/** The task's checklist now, for drawing. */
export async function trackerList($: EngineInterface) {
  const r = await read($, run)
  return r === null ? null : { list: r.list, isDone: r.isDone }
}

/** The task's size and whether it has a checklist, for the report check. */
export async function trackerTask($: EngineInterface): Promise<{ size?: string; hasChecklist: boolean }> {
  const r = await read($, run)
  if (r === null) return { hasChecklist: false }
  const size = r.list?.size ?? r.size
  return { ...(size ? { size } : {}), hasChecklist: (r.list?.items.length ?? 0) > 0 }
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
 * run, but the skill used in this conversation, a tentative run opens at once (it
 * is dropped at the turn's end if the turn was only a question).
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

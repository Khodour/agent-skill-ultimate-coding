/**
 * Reads check-diff's --hook output (JSON whose additionalContext is the report)
 * into findings. Pure, so the parsing is tested without running the script.
 */
import type { CheckResult, Finding } from '../types'

// A finding line: "path:12  [rule-id] what is wrong -> what to do (MUST 5)"
const LINE = /^.+?:(\d+)\s+\[([\w-]+)\]\s+(.+)$/

/** Turns the script's exit code and stdout into a result. */
export const parseCheck = (exitCode: number, stdout: string): CheckResult => {
  if (exitCode !== 0) return { status: 'error', message: `check-diff exited with ${exitCode}` }
  const text = stdout.trim()
  if (text === '') return { status: 'clean' }
  let report: unknown
  try {
    report = (JSON.parse(text) as { hookSpecificOutput?: { additionalContext?: unknown } }).hookSpecificOutput?.additionalContext
  } catch {
    return { status: 'error', message: 'check-diff output was not JSON' }
  }
  if (typeof report !== 'string') return { status: 'error', message: 'check-diff output had no report' }
  const findings: Finding[] = []
  for (const row of report.split('\n')) {
    const m = LINE.exec(row)
    if (m) findings.push({ line: Number(m[1]), rule: m[2] ?? '', message: (m[3] ?? '').replace(/\s*->.*?(\(MUST \d+\))?$/, ' $1').trim() })
  }
  return findings.length === 0 ? { status: 'clean' } : { status: 'found', findings }
}

/** How many edits came out clean and how many with dangers. */
export const tally = (results: Record<string, CheckResult>): { clean: number; found: number } => {
  const all = Object.values(results)
  return { clean: all.filter(r => r.status === 'clean').length, found: all.filter(r => r.status === 'found').length }
}

/**
 * The design-card gate's rules. An edit that touches a Complex area (money,
 * access, personal data, a migration, concurrency, a public API) waits until
 * a design card covers that area. Pure, so every rule is tested alone.
 */
import type { Area, Card, Lang, Size } from '../types'

// Word edges are letters only (not \b), so names like has_permission, user_email and refund_amount still match.
const AREA_SIGNALS: Record<Area, RegExp> = {
  money: /(?<![A-Za-z])(price|prices|amount|amounts|invoice|invoices|refund|refunds|payment|payments|payout|charge|charges|currency|cents|balance|billing|subtotal|discount)(?![A-Za-z])/i,
  access: /(?<![A-Za-z])(auth|authorize|authorization|authenticate|login|logout|password|passwd|jwt|oauth|permission|permissions|role|roles|acl|rbac|is_admin|isAdmin)(?![A-Za-z])/i,
  privacy: /(?<![A-Za-z])(email|emails|phone|phone_number|phoneNumber|birthdate|birth_date|date_of_birth|dob|ssn|passport|national_id)(?![A-Za-z])/i,
  migration: /(?<![A-Za-z])(ALTER\s+TABLE|DROP\s+(TABLE|COLUMN)|CREATE\s+TABLE|ADD\s+COLUMN|RENAME\s+COLUMN)(?![A-Za-z])/i,
  race: /(?<![A-Za-z])(mutex|semaphore|atomic|deadlock|transaction|transactions|FOR\s+UPDATE|compare_and_swap|compareAndSwap)(?![A-Za-z])/i,
  compat: /\.proto$|openapi|swagger/i,
}
const MIGRATION_PATH = /(^|\/)migrations?\//i
const API_PATH = /(^|\/)(api|routes?|controllers?|endpoints?)\//i
const NOT_CODE = /\.(md|mdx|txt|rst|adoc|csv|log|lock)$|(^|\/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml)$/i
const SCAN = 20_000

export const AREAS: readonly Area[] = ['money', 'access', 'privacy', 'migration', 'race', 'compat']

/** The Complex areas an edit touches, from its file path and the new text (docs and lock files never). */
export const detectAreas = (path: string, text: string): Area[] => {
  if (NOT_CODE.test(path)) return []
  const body = text.slice(0, SCAN)
  return AREAS.filter(area =>
    AREA_SIGNALS[area].test(`${path}\n${body}`) ||
    (area === 'migration' && MIGRATION_PATH.test(path)) ||
    (area === 'compat' && API_PATH.test(path)))
}

/** The card field each area needs, and what it asks. */
export const AREA_FIELD: Record<Area, { key: string; hint: string }> = {
  money: { key: 'money', hint: 'integer cents or decimals? do split parts add up exactly to the whole?' },
  access: { key: 'access', hint: 'who may touch which record, checked on the server?' },
  privacy: { key: 'privacy', hint: 'what personal data is stored, logged or shown, and who sees it?' },
  migration: { key: 'way_back', hint: 'how is this undone if it goes wrong?' },
  race: { key: 'race', hint: 'what if two run at once: one transaction, a lock, or an atomic update?' },
  compat: { key: 'compat', hint: 'what keeps working for existing callers and saved data?' },
}

const SIZE_FIELDS: Record<Size, readonly string[]> = {
  Trivial: ['job'],
  Small: ['job', 'edges', 'done_when'],
  Normal: ['job', 'mirror', 'edges', 'twice', 'data', 'load', 'musts', 'done_when'],
  Complex: ['job', 'mirror', 'edges', 'twice', 'data', 'load', 'musts', 'done_when', 'risks'],
}
const SIZES: readonly Size[] = ['Trivial', 'Small', 'Normal', 'Complex']
const FILLER = /^\s*(n\/?a|tbd|todo|-+|\.+|\?+|x)\s*$/i

/** The fields a card must hold: those of its size, plus the line of each area still to cover (which makes it Complex). */
export const requiredFields = (size: Size, areas: readonly Area[]): string[] => {
  const base = areas.length > 0 ? SIZE_FIELDS.Complex : SIZE_FIELDS[size]
  return [...base, ...areas.map(a => AREA_FIELD[a].key)]
}

/** Checks the tool's input against the areas still to cover: the card, or what is missing. */
export const readCard = (input: Record<string, unknown>, pending: readonly Area[]): { card: Card; covers: Area[] } | { missing: string } => {
  const size = input.size
  if (typeof size !== 'string' || !SIZES.includes(size as Size)) return { missing: 'size (one of Trivial, Small, Normal, Complex)' }
  if (pending.length > 0 && size !== 'Complex') return { missing: `size "Complex": this task touches ${pending.join(', ')}` }
  const isFilled = (k: string) => typeof input[k] === 'string' && !FILLER.test(input[k] as string) && (input[k] as string).trim() !== ''
  const missing = requiredFields(size as Size, pending).filter(k => !isFilled(k))
  if (missing.length > 0) return { missing: `${missing.join(', ')} (a real answer each; "n/a" and the like do not count)` }
  const card = Object.fromEntries(Object.entries(input).filter(([k]) => k === 'size' || isFilled(k))) as Card
  return { card, covers: AREAS.filter(a => isFilled(AREA_FIELD[a].key)) }
}

/** What Claude is told when an edit must wait; `uncovered` are the areas the card does not answer yet. */
export const waitMessage = (uncovered: readonly Area[], hasCard: boolean, lang: Lang): string => {
  const lines = uncovered.map(a => `${AREA_FIELD[a].key} (${AREA_FIELD[a].hint})`).join('; ')
  const head = hasCard
    ? `Ultimate Coding: this edit also touches ${uncovered.join(', ')}, which the design card does not cover yet. ` +
      `Call design_card again with size "Complex", the full card, and these lines: ${lines}.`
    : `Ultimate Coding: this edit touches ${uncovered.join(', ')}, so it is a Complex task. ` +
      `Before editing, call design_card with size "Complex", the full card (job, mirror, edges, twice, data, load, musts, done_when, risks) and these lines: ${lines}.`
  return lang === 'ar' ? `${head} Write the card's content in Arabic, the user's language.` : head
}

/** The user's language from their own text: Arabic when most of its letters are Arabic. */
export const detectLang = (text: string): Lang => {
  const arabic = (text.match(/[؀-ۿ]/g) ?? []).length
  const latin = (text.match(/[A-Za-z]/g) ?? []).length
  return arabic > 0 && arabic >= latin ? 'ar' : 'en'
}

const LABELS: Record<Lang, Record<string, string>> = {
  en: {
    title: 'Design card', job: 'Job', mirror: 'Mirror', edges: 'Edges', twice: 'Twice?', data: 'Data', load: 'Load',
    musts: 'MUSTs', done_when: 'Done when', risks: 'Risks', money: 'Money', access: 'Access', privacy: 'Privacy',
    way_back: 'Way back', race: 'Race', compat: 'Compat',
    Trivial: 'Trivial', Small: 'Small', Normal: 'Normal', Complex: 'Complex',
  },
  ar: {
    title: 'بطاقة التصميم', job: 'المهمة', mirror: 'المثال المشابه', edges: 'الحالات الحدية', twice: 'التكرار', data: 'البيانات',
    load: 'الحِمل', musts: 'القواعد الإلزامية', done_when: 'يكتمل عندما', risks: 'المخاطر', money: 'المال', access: 'الصلاحيات',
    privacy: 'الخصوصية', way_back: 'طريق العودة', race: 'التزامن', compat: 'التوافق',
    Trivial: 'بسيطة جدًا', Small: 'صغيرة', Normal: 'عادية', Complex: 'معقّدة',
  },
}
const ORDER = ['job', 'mirror', 'edges', 'twice', 'data', 'load', 'musts', 'done_when', 'risks', 'money', 'access', 'privacy', 'way_back', 'race', 'compat']

/** A label in the card's language (English when unknown). */
export const label = (key: string, lang: Lang): string => LABELS[lang][key] ?? LABELS.en[key] ?? key

/** The card's rows in display order, labelled in its language. */
export const cardRows = (card: Card, lang: Lang): [string, string][] =>
  ORDER.filter(k => typeof card[k] === 'string').map(k => [label(k, lang), card[k] as string])

export const TOOL_NAME = 'design_card'
export const TOOL_DESCRIPTION =
  'Records the Ultimate Coding design card for the current task. Required before editing code that touches money, ' +
  'access control, personal data, a migration, concurrency or a public API (a Complex task); useful for any task. ' +
  'Sizes: Trivial (job), Small (job, edges, done_when), Normal (job, mirror, edges, twice, data, load, musts, done_when), ' +
  'Complex (Normal plus risks, plus one line per area touched: money, access, privacy, way_back, race, compat). ' +
  'A few real words per line, in the user\'s language; "n/a" does not count.'
export const TOOL_SCHEMA = {
  type: 'object',
  properties: {
    size: { type: 'string', enum: ['Trivial', 'Small', 'Normal', 'Complex'] },
    job: { type: 'string', description: 'what it does, one sentence without "and"' },
    mirror: { type: 'string', description: 'the closest existing piece to copy, or "none"' },
    edges: { type: 'string', description: 'inputs that break naive code' },
    twice: { type: 'string', description: 'what happens if it runs twice' },
    data: { type: 'string', description: 'what is read and written; one transaction?' },
    load: { type: 'string', description: 'how often, how much; calls in a loop?' },
    musts: { type: 'string', description: 'the MUST numbers that apply' },
    done_when: { type: 'string', description: 'the checks that prove it' },
    risks: { type: 'string', description: 'Complex: races, permissions, data loss, the way back' },
    money: { type: 'string', description: AREA_FIELD.money.hint },
    access: { type: 'string', description: AREA_FIELD.access.hint },
    privacy: { type: 'string', description: AREA_FIELD.privacy.hint },
    way_back: { type: 'string', description: AREA_FIELD.migration.hint },
    race: { type: 'string', description: AREA_FIELD.race.hint },
    compat: { type: 'string', description: AREA_FIELD.compat.hint },
  },
  required: ['size', 'job'],
}

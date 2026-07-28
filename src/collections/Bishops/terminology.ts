/**
 * Ge'ez-Rite terminology for the Eparchs of Segheneyti.
 *
 * This is an Eritrean Catholic (Ge'ez Rite) eparchy, so the vocabulary here is
 * deliberately NOT Latin-rite: eparchy not diocese, eparch not bishop,
 * enthronement not installation, Protosyncellus not Vicar General, Divine
 * Liturgy not Mass.
 *
 * ── Why every stored value is an English kebab slug ──────────────────────────
 * The Tigrinya rendering of several of these terms still needs chancery
 * confirmation (see docs/tigrinya-review-bishops.md). Storing a stable slug and
 * translating it at render time means a correction is a one-line edit in
 * messages/ti.json — no enum change, no migration, no data rewrite. Never store
 * a display label.
 *
 * ── Canonical note on appointment ────────────────────────────────────────────
 * The Eritrean Catholic Church is a Metropolitan Church sui iuris (metropolitan
 * see: Asmara; Segheneyti is one of its four eparchies). Under CCEO a Synod of
 * Bishops and a Patriarch belong to patriarchal and major archiepiscopal
 * Churches — Eritrea has neither. Its eparchs are appointed by the Roman
 * Pontiff, with the Council of Hierarchs proposing candidates. The appointing
 * authority options below model that, not a patriarchal election.
 */

/** Option shape Payload's `select` field expects. */
export interface TermOption {
  label: string
  value: string
}

/** Build a Payload select option list from a slug→English-label record. */
function options<T extends Record<string, string>>(map: T): TermOption[] {
  return Object.entries(map).map(([value, label]) => ({ value, label }))
}

/**
 * Honorifics used before an Eparch's name.
 *
 * `abune` is the Ge'ez-rite form and the expected default; the Latin-rite
 * styles are offered because a predecessor added later for the historical
 * record may have been styled that way in the sources we cite.
 */
export const HONORIFIC_LABELS = {
  abune: 'Abune (ኣቡነ)',
  'his-excellency-abune': 'His Excellency Abune (ብጹዕ ኣቡነ)',
  'most-reverend': 'Most Reverend',
  'his-eminence': 'His Eminence',
  other: 'Other — write it into the formal title field',
} as const

export type Honorific = keyof typeof HONORIFIC_LABELS
export const HONORIFIC_OPTIONS = options(HONORIFIC_LABELS)

/**
 * Life & ministry milestone types.
 *
 * Baptism, chrismation and first communion are listed separately even though in
 * the Ge'ez tradition all three are normally conferred together in infancy —
 * staff recording a single initiation should use `baptism` and describe the
 * rest, but a record that distinguishes them must not need a schema change.
 */
export const MILESTONE_TYPE_LABELS = {
  birth: 'Birth',
  baptism: 'Baptism',
  chrismation: 'Chrismation',
  'first-communion': 'First Communion',
  'minor-seminary': 'Minor seminary',
  'major-seminary': 'Major seminary',
  'philosophy-theology-studies': 'Philosophy / theology studies',
  'religious-profession': 'Religious profession',
  'diaconate-ordination': 'Ordination to the diaconate',
  'priestly-ordination': 'Ordination to the priesthood',
  'pastoral-assignment': 'Pastoral assignment',
  'further-studies': 'Further studies',
  'academic-appointment': 'Academic appointment',
  'curial-role': 'Curial / chancery role',
  'episcopal-appointment': 'Episcopal appointment',
  'episcopal-consecration': 'Episcopal consecration',
  enthronement: 'Enthronement as Eparch',
  'synod-participation': 'Synod / Council of Hierarchs participation',
  'pastoral-visit': 'Pastoral visit',
  'pastoral-act': 'Significant pastoral act',
  retirement: 'Retirement',
  transfer: 'Transfer',
  death: 'Death',
  other: 'Other',
} as const

export type MilestoneType = keyof typeof MILESTONE_TYPE_LABELS
export const MILESTONE_TYPE_OPTIONS = options(MILESTONE_TYPE_LABELS)

/**
 * Life periods the public timeline groups by. Forty flat entries is a wall of
 * text; four labelled arcs is a life.
 */
export const LIFE_PERIODS = ['origins', 'formation', 'priesthood', 'episcopacy'] as const
export type LifePeriod = (typeof LIFE_PERIODS)[number]

/**
 * Which arc a milestone belongs to. `retirement`/`death` stay in `episcopacy`
 * rather than forming a fifth group of one or two entries.
 */
export const MILESTONE_PERIOD: Record<MilestoneType, LifePeriod> = {
  birth: 'origins',
  baptism: 'origins',
  chrismation: 'origins',
  'first-communion': 'origins',
  'minor-seminary': 'formation',
  'major-seminary': 'formation',
  'philosophy-theology-studies': 'formation',
  'religious-profession': 'formation',
  'diaconate-ordination': 'formation',
  'priestly-ordination': 'priesthood',
  'pastoral-assignment': 'priesthood',
  'further-studies': 'priesthood',
  'academic-appointment': 'priesthood',
  'curial-role': 'priesthood',
  'episcopal-appointment': 'episcopacy',
  'episcopal-consecration': 'episcopacy',
  enthronement: 'episcopacy',
  'synod-participation': 'episcopacy',
  'pastoral-visit': 'episcopacy',
  'pastoral-act': 'episcopacy',
  retirement: 'episcopacy',
  transfer: 'episcopacy',
  death: 'episcopacy',
  other: 'episcopacy',
}

/**
 * How precisely a date is known.
 *
 * Rural and historical Eritrean records are frequently imprecise. Without this,
 * a date field forces staff to invent 1 January for a man they only know was
 * born "around 1958" — and the site then publishes that invention as fact.
 */
export const DATE_PRECISION_LABELS = {
  exact: 'Exact date',
  month: 'Month and year only',
  year: 'Year only',
  approximate: 'Approximate (circa)',
  ongoing: 'Ongoing — no end date',
} as const

export type DatePrecision = keyof typeof DATE_PRECISION_LABELS
export const DATE_PRECISION_OPTIONS = options(DATE_PRECISION_LABELS)

/**
 * The role another person played in a milestone.
 *
 * `principal-consecrator` is what carries apostolic succession, so it is worth
 * recording precisely even when the man himself is not in our `priests` data.
 */
export const ASSOCIATED_ROLE_LABELS = {
  'principal-consecrator': 'Principal consecrator',
  'co-consecrator': 'Co-consecrator',
  'ordaining-bishop': 'Ordaining bishop',
  'appointing-pontiff': 'Appointing Roman Pontiff',
  presenter: 'Presenter / sponsor',
  predecessor: 'Predecessor in the office',
  other: 'Other',
} as const

export type AssociatedRole = keyof typeof ASSOCIATED_ROLE_LABELS
export const ASSOCIATED_ROLE_OPTIONS = options(ASSOCIATED_ROLE_LABELS)

/** Honors, awards and recognitions — not chronological milestones. */
export const HONOR_CATEGORY_LABELS = {
  ecclesiastical: 'Ecclesiastical honour',
  academic: 'Academic degree or honorary doctorate',
  civil: 'Civil or state honour',
  recognition: 'Recognition or commendation',
  other: 'Other',
} as const

export type HonorCategory = keyof typeof HONOR_CATEGORY_LABELS
export const HONOR_CATEGORY_OPTIONS = options(HONOR_CATEGORY_LABELS)

/** Reference-link provenance, so the public page can badge a source honestly. */
export const LINK_TYPE_LABELS = {
  'holy-see': 'Holy See / Vatican announcement',
  'eritrean-catholic-church': 'Eritrean Catholic Church source',
  'news-article': 'News article',
  video: 'Video',
  'reference-database': 'Reference database (e.g. catholic-hierarchy.org)',
  document: 'Document',
  other: 'Other',
} as const

export type LinkType = keyof typeof LINK_TYPE_LABELS
export const LINK_TYPE_OPTIONS = options(LINK_TYPE_LABELS)

/**
 * Who appointed the Eparch. See the canonical note at the top of this file:
 * for a Metropolitan Church sui iuris the appointment is the Roman Pontiff's.
 */
export const APPOINTING_AUTHORITY_LABELS = {
  'roman-pontiff': 'Roman Pontiff (Pope)',
  'council-of-hierarchs': 'Council of Hierarchs of the Eritrean Catholic Church',
  'dicastery-eastern-churches': 'Dicastery for the Eastern Churches',
  other: 'Other',
} as const

export type AppointingAuthority = keyof typeof APPOINTING_AUTHORITY_LABELS
export const APPOINTING_AUTHORITY_OPTIONS = options(APPOINTING_AUTHORITY_LABELS)

/** Why a term of office ended. */
export const TERM_END_REASON_LABELS = {
  retired: 'Retired',
  transferred: 'Transferred to another see',
  deceased: 'Deceased',
  other: 'Other',
} as const

export type TermEndReason = keyof typeof TERM_END_REASON_LABELS
export const TERM_END_REASON_OPTIONS = options(TERM_END_REASON_LABELS)

/** Status of a pastoral priority or initiative. */
export const INITIATIVE_STATUS_LABELS = {
  planned: 'Planned',
  ongoing: 'Ongoing',
  completed: 'Completed',
  paused: 'Paused',
} as const

export type InitiativeStatus = keyof typeof INITIATIVE_STATUS_LABELS
export const INITIATIVE_STATUS_OPTIONS = options(INITIATIVE_STATUS_LABELS)

/** Document types attachable to a bishop or a milestone. */
export const DOCUMENT_TYPE_LABELS = {
  'appointment-bull': 'Bull / decree of appointment',
  'pastoral-letter': 'Pastoral letter',
  decree: 'Decree',
  homily: 'Homily',
  'academic-paper': 'Academic paper',
  other: 'Other',
} as const

export type DocumentType = keyof typeof DOCUMENT_TYPE_LABELS
export const DOCUMENT_TYPE_OPTIONS = options(DOCUMENT_TYPE_LABELS)

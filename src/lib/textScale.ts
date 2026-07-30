/**
 * The reader's text-size preference.
 *
 * The CSS variable `--content-scale` has existed since the magazine work — the
 * news headlines already multiply by it — but nothing ever SET it. This module
 * plus the /settings control is the missing half: a cookie the server layout
 * reads, so the chosen size is in the first byte of HTML with no flash of the
 * wrong size and no layout shift on hydration.
 *
 * Content scales; chrome does not. Navigation, buttons and form controls keep
 * their fixed sizes — the point is comfortable READING for older eyes, not a
 * zoomed interface, and browser zoom already exists for the latter.
 */

export const TEXT_SCALE_COOKIE = 'text-scale'

/** The three steps offered. Values are the CSS multiplier, stored verbatim. */
export const TEXT_SCALES = [
  { key: 'normal', value: '1' },
  { key: 'large', value: '1.125' },
  { key: 'larger', value: '1.25' },
] as const

export type TextScaleKey = (typeof TEXT_SCALES)[number]['key']

const VALID_VALUES = new Set<string>(TEXT_SCALES.map((s) => s.value))

/**
 * Narrow an untrusted cookie value to a known multiplier.
 *
 * The value is interpolated into an inline `style` attribute by the server
 * layout, so this is a security boundary, not just hygiene: only the three
 * known strings pass, anything else — including a crafted cookie — falls back
 * to 1.
 */
export function parseTextScale(value: string | undefined): string {
  return value !== undefined && VALID_VALUES.has(value) ? value : '1'
}

/** The step key for a stored value, for marking the active button. */
export function scaleKeyFor(value: string | undefined): TextScaleKey {
  const parsed = parseTextScale(value)
  return TEXT_SCALES.find((s) => s.value === parsed)?.key ?? 'normal'
}

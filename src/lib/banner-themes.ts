/**
 * Seasonal banner themes for the site-wide page hero (PageHeader).
 *
 * The active theme is chosen in the admin panel (Banner Settings global),
 * either manually or via a date-range schedule, and is applied through CSS
 * variables set on <body> in the frontend layout. Every value here must
 * keep white headings readable (WCAG AA on large text).
 */

export type BannerThemeKey =
  | 'default'
  | 'advent'
  | 'christmas'
  | 'lent'
  | 'holy-week'
  | 'easter'
  | 'pentecost'
  | 'marian-blue'
  | 'sky-blue'
  | 'forest-green'
  | 'royal-gold'
  | 'charcoal'
  | 'custom'

export interface BannerThemeColors {
  /** Banner background color */
  background: string
  /** Muted text color for the subtitle line */
  subtitle: string
  /** Color of the short underline accent bar */
  accent: string
  /** Opacity (0–1) of the tiled cross pattern */
  patternOpacity: number
}

/** Preset palettes. `default` matches the original hardcoded design exactly
 *  (maroon-800 background, maroon-200 subtitle, gold-400 accent). */
export const BANNER_THEMES: Record<Exclude<BannerThemeKey, 'custom'>, BannerThemeColors> = {
  default: {
    background: '#911e1e',
    subtitle: '#fbcccc',
    accent: '#fbbf24',
    patternOpacity: 0.05,
  },
  advent: {
    background: '#4b2e83',
    subtitle: '#d9cdee',
    accent: '#fbbf24',
    patternOpacity: 0.05,
  },
  christmas: {
    background: '#14532d',
    subtitle: '#c7e8d0',
    accent: '#fcd34d',
    patternOpacity: 0.07,
  },
  lent: {
    background: '#3d2b52',
    subtitle: '#c9bfd8',
    accent: '#d97706',
    patternOpacity: 0.04,
  },
  'holy-week': {
    background: '#5c0f1d',
    subtitle: '#eec7cc',
    accent: '#d97706',
    patternOpacity: 0.04,
  },
  easter: {
    background: '#b45309',
    subtitle: '#fef3c7',
    accent: '#fffbeb',
    patternOpacity: 0.08,
  },
  pentecost: {
    background: '#b91c1c',
    subtitle: '#fecaca',
    accent: '#fbbf24',
    patternOpacity: 0.06,
  },
  // Plain colour themes, named by the colour they actually render — chosen
  // after "blue" in the custom field silently fell back to brand maroon and
  // read as the picker lying about its colours.
  'marian-blue': {
    background: '#1e3a8a',
    subtitle: '#bfdbfe',
    accent: '#fbbf24',
    patternOpacity: 0.05,
  },
  'sky-blue': {
    background: '#0369a1',
    subtitle: '#bae6fd',
    accent: '#fde68a',
    patternOpacity: 0.05,
  },
  'forest-green': {
    background: '#166534',
    subtitle: '#bbf7d0',
    accent: '#fbbf24',
    patternOpacity: 0.05,
  },
  'royal-gold': {
    background: '#92400e',
    subtitle: '#fde68a',
    accent: '#fffbeb',
    patternOpacity: 0.06,
  },
  charcoal: {
    background: '#1f2937',
    subtitle: '#d1d5db',
    accent: '#fbbf24',
    patternOpacity: 0.05,
  },
}

/** Options for the admin select fields — single source of truth for keys + labels.
 *  Each label ends with the exact hex it renders, so the picker cannot promise
 *  one colour and paint another. */
export const BANNER_THEME_OPTIONS: Array<{ label: string; value: BannerThemeKey }> = [
  { label: 'Default — Brand Red (Ordinary Time) · #911e1e', value: 'default' },
  { label: 'Advent — Royal Purple · #4b2e83', value: 'advent' },
  { label: 'Christmas — Evergreen & Gold · #14532d', value: 'christmas' },
  { label: 'Lent — Somber Violet · #3d2b52', value: 'lent' },
  { label: 'Holy Week — Deep Crimson · #5c0f1d', value: 'holy-week' },
  { label: 'Easter — Radiant Gold · #b45309', value: 'easter' },
  { label: 'Pentecost — Fire Red · #b91c1c', value: 'pentecost' },
  { label: 'Marian Blue — Deep Blue · #1e3a8a', value: 'marian-blue' },
  { label: 'Sky Blue — Bright Blue · #0369a1', value: 'sky-blue' },
  { label: 'Forest Green · #166534', value: 'forest-green' },
  { label: 'Royal Gold — Warm Amber · #92400e', value: 'royal-gold' },
  { label: 'Charcoal — Slate Grey · #1f2937', value: 'charcoal' },
  { label: 'Custom colours…', value: 'custom' },
]

/** A resolved, ready-to-render banner: theme colors plus the optional
 *  uploaded background image. */
export interface ResolvedBanner extends BannerThemeColors {
  /** URL of the uploaded banner image, or null for a plain colour banner */
  imageUrl: string | null
  /** Opacity (0–1) of the image itself — below 1 the theme colour shows through */
  imageOpacity: number
  /** Opacity (0–1) of the theme-colour tint laid over the image */
  imageOverlayOpacity: number
}

/** Shape of the `banner-settings` Payload global (see src/globals/BannerSettings). */
export interface BannerSettingsData {
  mode?: 'manual' | 'scheduled' | null
  theme?: BannerThemeKey | null
  custom?: {
    background?: string | null
    subtitleColor?: string | null
    accentColor?: string | null
    patternOpacity?: number | null
  } | null
  image?: {
    image?: { url?: string | null } | string | number | null
    opacity?: number | null
    overlayOpacity?: number | null
  } | null
  schedule?: Array<{
    label?: string | null
    theme?: BannerThemeKey | null
    startDate?: string | null
    endDate?: string | null
  }> | null
}

const HEX_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

/**
 * Colour NAMES admins actually type. "blue" used to fail the hex check and
 * silently fall back to brand maroon — the picker appeared to lie ("I chose
 * blue and got another colour"). Names now resolve to the colour they say.
 */
export const NAMED_COLORS: Record<string, string> = {
  blue: '#1e3a8a',
  lightblue: '#0369a1',
  skyblue: '#0369a1',
  navy: '#1e293b',
  red: '#b91c1c',
  maroon: '#911e1e',
  green: '#166534',
  purple: '#4b2e83',
  violet: '#6d28d9',
  gold: '#b45309',
  yellow: '#ca8a04',
  orange: '#c2410c',
  brown: '#78350f',
  black: '#111111',
  grey: '#1f2937',
  gray: '#1f2937',
  white: '#ffffff',
  pink: '#be185d',
  teal: '#0f766e',
}

/** Resolve a hex value or a known colour name; null when unrecognized. */
export function parseColor(value: string | null | undefined): string | null {
  if (!value) return null
  const v = value.trim().toLowerCase()
  if (HEX_RE.test(v)) return v
  return NAMED_COLORS[v.replace(/[\s-]/g, '')] ?? null
}

function safeColor(value: string | null | undefined, fallback: string): string {
  return parseColor(value) ?? fallback
}

function themeFromKey(key: BannerThemeKey | null | undefined, settings: BannerSettingsData): BannerThemeColors {
  if (key === 'custom') {
    const base = BANNER_THEMES.default
    const c = settings.custom ?? {}
    return {
      background: safeColor(c.background, base.background),
      subtitle: safeColor(c.subtitleColor, base.subtitle),
      accent: safeColor(c.accentColor, base.accent),
      patternOpacity:
        typeof c.patternOpacity === 'number'
          ? Math.min(Math.max(c.patternOpacity, 0), 100) / 100
          : base.patternOpacity,
    }
  }
  return BANNER_THEMES[key ?? 'default'] ?? BANNER_THEMES.default
}

const pct = (value: number | null | undefined, fallback: number): number =>
  typeof value === 'number' ? Math.min(Math.max(value, 0), 100) / 100 : fallback

function resolveImage(
  settings: BannerSettingsData,
): Pick<ResolvedBanner, 'imageUrl' | 'imageOpacity' | 'imageOverlayOpacity'> {
  const img = settings.image?.image
  const imageUrl = img && typeof img === 'object' && typeof img.url === 'string' && img.url ? img.url : null
  if (!imageUrl) return { imageUrl: null, imageOpacity: 1, imageOverlayOpacity: 0 }
  // Shown exactly as uploaded unless the admin fades it (opacity) or tints it (overlay).
  return {
    imageUrl,
    imageOpacity: pct(settings.image?.opacity, 1),
    imageOverlayOpacity: pct(settings.image?.overlayOpacity, 0),
  }
}

/**
 * Resolve the banner to render right now.
 * In scheduled mode the first entry whose date range contains `now` wins
 * (end date inclusive through the end of that day); otherwise — and in
 * manual mode — the manually selected theme applies. An uploaded banner
 * image (if any) applies on top of whichever theme is active.
 */
export function resolveBannerTheme(
  settings: BannerSettingsData | null | undefined,
  now: Date = new Date(),
): ResolvedBanner {
  if (!settings) return { ...BANNER_THEMES.default, imageUrl: null, imageOpacity: 1, imageOverlayOpacity: 0 }

  const image = resolveImage(settings)

  if (settings.mode === 'scheduled' && Array.isArray(settings.schedule)) {
    for (const entry of settings.schedule) {
      if (!entry?.startDate || !entry?.endDate) continue
      const start = new Date(entry.startDate)
      const end = new Date(entry.endDate)
      end.setHours(23, 59, 59, 999)
      if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime()) && now >= start && now <= end) {
        return withImage(themeFromKey(entry.theme, settings), image)
      }
    }
  }

  return withImage(themeFromKey(settings.theme, settings), image)
}

/** An uploaded banner replaces the coloured design entirely, so the decorative
 *  cross pattern is hidden whenever an image is present. */
function withImage(
  colors: BannerThemeColors,
  image: Pick<ResolvedBanner, 'imageUrl' | 'imageOpacity' | 'imageOverlayOpacity'>,
): ResolvedBanner {
  return { ...colors, ...image, ...(image.imageUrl ? { patternOpacity: 0 } : {}) }
}

/**
 * Slug generation and validation utilities.
 */

/**
 * Convert a plain text string to a URL-safe slug.
 * Handles basic Latin characters. For Tigrinya/Ge'ez text,
 * a transliteration step should be applied before slugifying.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')   // remove non-word chars
    .replace(/[\s_-]+/g, '-')  // convert spaces/underscores to hyphens
    .replace(/^-+|-+$/g, '')   // trim leading/trailing hyphens
}

/** Returns true if the string looks like a valid slug */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
}

/** Build a Ge'ez calendar entry slug from year/month/day */
export function buildGeezCalendarSlug(
  geezYear: number,
  geezMonthSlug: string,
  geezDay: number,
): string {
  return `${geezYear}-${geezMonthSlug}-${String(geezDay).padStart(2, '0')}`
}

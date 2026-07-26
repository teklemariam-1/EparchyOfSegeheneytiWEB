/**
 * The small "article" glyph shown beside the date, mirroring the reference
 * layout's type indicator.
 *
 * Gold on both the white info bar and the maroon hero panel. `gold-600` on
 * white measures 3.19:1, which clears the 3:1 WCAG AA minimum for non-text
 * graphics (it would NOT be enough for text, which is why the date beside it
 * stays charcoal). On maroon-800 the lighter `gold-300` measures 6.05:1.
 *
 * Decorative: the date and headline already carry the meaning, so it is hidden
 * from assistive technology rather than given a label that would be read out
 * before every headline in the list.
 */
export function ArticleTypeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.25}
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {/* Stacked lines with a leading marker — a "text item" mark. */}
      <path d="M3 6h2M3 12h2M3 18h2" />
      <path d="M9 6h12M9 12h12M9 18h8" />
    </svg>
  )
}

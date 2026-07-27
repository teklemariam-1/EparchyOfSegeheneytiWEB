'use client'

/**
 * Opens the browser's print dialogue for the printable biography.
 *
 * A print stylesheet rather than generated PDF: the Eparchy already produces
 * printed publications, and `window.print()` with good `@media print` rules
 * gives a clean page for programmes and commemorative booklets at no bundle
 * cost — where a PDF generator would have added a large dependency to every
 * visitor's download for the same result.
 *
 * Hidden when printing (`print:hidden`) so the button never appears on paper.
 */
export function PrintButton({ label }: { label: string }) {
  return (
    <button type="button" onClick={() => window.print()} className="btn-secondary print:hidden">
      <span aria-hidden="true">⎙</span>
      {label}
    </button>
  )
}

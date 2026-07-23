'use client'

/**
 * Exports the dashboard as a PDF via the browser's print-to-PDF pipeline.
 * A print stylesheet (admin custom.css) hides the admin chrome and shows a
 * report header, so the output reads as a standalone report. Page numbers
 * come from the browser's print headers/footers.
 */
export function ExportPdfButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      title='Choose "Save as PDF" in the print dialog. Enable "Headers and footers" for page numbers.'
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '7px 14px',
        borderRadius: 6,
        border: '1px solid var(--theme-elevation-150)',
        background: 'var(--theme-elevation-800)',
        color: 'var(--theme-elevation-0)',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      Export PDF
    </button>
  )
}

export default ExportPdfButton

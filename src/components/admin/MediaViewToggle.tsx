'use client'

import React, { useEffect, useState } from 'react'

/**
 * View-mode switcher for the Media library list (Admin → Media).
 *
 * Payload renders the media list as a table; these buttons re-style it into
 * thumbnail grids of three densities purely with CSS (see the
 * `[data-media-view]` rules in admin/custom.css) by stamping an attribute on
 * the list container. "Details" restores Payload's native table. The choice
 * persists per browser in localStorage.
 *
 * Registered as `admin.components.beforeListTable` on the Media collection,
 * which places it directly above the list — the "buttons on the upper of the
 * media page" staff asked for.
 */

type ViewMode = 'details' | 'small' | 'medium' | 'large'

const STORAGE_KEY = 'eparchy-media-view'
const MODES: Array<{ mode: ViewMode; label: string; icon: React.ReactNode }> = [
  {
    mode: 'details',
    label: 'Details',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
        <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    mode: 'large',
    label: 'Large',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
        <rect x="3" y="3" width="8" height="8" rx="1" />
        <rect x="13" y="3" width="8" height="8" rx="1" />
        <rect x="3" y="13" width="8" height="8" rx="1" />
        <rect x="13" y="13" width="8" height="8" rx="1" />
      </svg>
    ),
  },
  {
    mode: 'medium',
    label: 'Medium',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="3" y="3" width="5" height="5" />
        <rect x="10" y="3" width="5" height="5" />
        <rect x="17" y="3" width="5" height="5" />
        <rect x="3" y="10" width="5" height="5" />
        <rect x="10" y="10" width="5" height="5" />
        <rect x="17" y="10" width="5" height="5" />
        <rect x="3" y="17" width="5" height="5" />
        <rect x="10" y="17" width="5" height="5" />
        <rect x="17" y="17" width="5" height="5" />
      </svg>
    ),
  },
  {
    mode: 'small',
    label: 'Small',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        {Array.from({ length: 16 }, (_, i) => (
          <rect key={i} x={3 + (i % 4) * 5} y={3 + Math.floor(i / 4) * 5} width="3.4" height="3.4" />
        ))}
      </svg>
    ),
  },
]

function applyMode(mode: ViewMode) {
  // The list wrapper isn't an ancestor this component can reach via context,
  // so the attribute is stamped on it directly. Falls back to <body> so the
  // CSS still applies if Payload renames the wrapper class.
  const target =
    document.querySelector('.collection-list--media') ??
    document.querySelector('.collection-list') ??
    document.body
  target.setAttribute('data-media-view', mode)
}

export function MediaViewToggle() {
  const [mode, setMode] = useState<ViewMode>('details')

  useEffect(() => {
    let stored: ViewMode | null = null
    try {
      stored = window.localStorage.getItem(STORAGE_KEY) as ViewMode | null
    } catch {
      // Storage blocked — session-only preference.
    }
    const initial = stored && MODES.some((m) => m.mode === stored) ? stored : 'details'
    setMode(initial)
    applyMode(initial)
  }, [])

  const select = (next: ViewMode) => {
    setMode(next)
    applyMode(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Storage blocked — session-only preference.
    }
  }

  return (
    <div className="media-view-toggle" role="group" aria-label="Media view style">
      <span className="media-view-toggle__label">View:</span>
      {MODES.map(({ mode: m, label, icon }) => (
        <button
          key={m}
          type="button"
          onClick={() => select(m)}
          aria-pressed={mode === m}
          className={`media-view-toggle__btn${mode === m ? ' media-view-toggle__btn--active' : ''}`}
        >
          {icon}
          {label}
        </button>
      ))}
    </div>
  )
}

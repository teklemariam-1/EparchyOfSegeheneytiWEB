'use client'

import Link from 'next/link'
import { useEffect, useId, useRef, useState } from 'react'

interface Child {
  label: string
  href: string
  newTab?: boolean
  description?: string
}

/**
 * Accessible primary-nav dropdown.
 *
 * The previous menu opened only on CSS :hover, so keyboard and touch users
 * could not open it at all. Here mouse hover stays a pure-CSS convenience
 * (group-hover), while click, Enter/Space, and ArrowDown drive real open state
 * with correct `aria-expanded`; Escape closes and restores focus to the
 * trigger, and an outside pointer-down or focus-out closes the menu.
 */
export function NavDropdown({ label, items }: { label: string; items: Child[] }) {
  const [open, setOpen] = useState(false)
  const wrap = useRef<HTMLDivElement>(null)
  const btn = useRef<HTMLButtonElement>(null)
  const focusFirstOnOpen = useRef(false)
  const menuId = useId()

  // Close on outside pointer-down (mouse + touch).
  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [open])

  // After a keyboard-open (ArrowDown), move focus to the first item once the
  // menu has rendered as focusable.
  useEffect(() => {
    if (open && focusFirstOnOpen.current) {
      focusFirstOnOpen.current = false
      wrap.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus()
    }
  }, [open])

  const onButtonKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      focusFirstOnOpen.current = true
      setOpen(true)
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  const onMenuKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false)
      btn.current?.focus()
    }
  }

  // Close when focus leaves the whole widget (keyboard tab-out).
  const onBlur = (e: React.FocusEvent) => {
    if (!wrap.current?.contains(e.relatedTarget as Node)) setOpen(false)
  }

  return (
    <div ref={wrap} className="relative group" onBlur={onBlur}>
      <button
        ref={btn}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onButtonKeyDown}
        className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-charcoal-700 hover:text-maroon-800 rounded-md hover:bg-charcoal-50 transition-colors focus-visible:ring-2 focus-visible:ring-maroon-600 focus-visible:outline-none"
      >
        {label}
        <svg
          className={`h-3.5 w-3.5 opacity-60 transition-transform group-hover:opacity-100 ${open ? 'rotate-180 opacity-100' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
        </svg>
      </button>

      <div
        id={menuId}
        role="menu"
        onKeyDown={onMenuKeyDown}
        className={`absolute left-0 top-full mt-1 w-52 rounded-xl bg-white shadow-lg border border-charcoal-100 py-1 transition-all duration-150 z-50 group-hover:opacity-100 group-hover:visible ${
          open ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
      >
        {items.map((child) => (
          <Link
            key={`${child.label}-${child.href}`}
            href={child.href}
            role="menuitem"
            tabIndex={open ? 0 : -1}
            onClick={() => setOpen(false)}
            {...(child.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            className="block px-4 py-2 text-sm text-charcoal-700 hover:bg-parchment hover:text-maroon-800 transition-colors focus-visible:bg-parchment focus-visible:text-maroon-800 focus-visible:outline-none"
          >
            {child.label}
            {child.description && (
              <span className="mt-0.5 block text-xs text-charcoal-400">{child.description}</span>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}

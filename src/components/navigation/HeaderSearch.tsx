'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Suggestion {
  title: string
  href: string
  type: string
  icon: string
}

/**
 * Search from the header.
 *
 * The form is real: it is a `GET` to `/search`, so pressing Enter navigates to
 * the results page whether or not any of this JavaScript ran. Everything else
 * here — the dropdown, the debounce, the arrow keys — is an accelerator layered
 * on a working form. On a slow connection the form is usable long before the
 * suggestions arrive, which is the right order for this audience.
 *
 * On mobile the box collapses to an icon that expands in place, because the
 * header has no room for a text field beside a logo and a menu button, and
 * burying search inside the drawer is how people conclude a site has none.
 */
export function HeaderSearch({
  locale,
  labels,
}: {
  locale: string
  labels: {
    placeholder: string
    srLabel: string
    open: string
    close: string
    suggestions: string
  }
}) {
  const router = useRouter()
  const listId = useId()

  const [expanded, setExpanded] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Suggestion[]>([])
  const [active, setActive] = useState(-1)

  const inputRef = useRef<HTMLInputElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  // Fetch suggestions, debounced, with the previous request cancelled.
  //
  // Cancellation is not an optimisation here: without it a slow early response
  // can land after a fast later one and repopulate the list with suggestions
  // for a prefix the reader has already typed past.
  useEffect(() => {
    const term = query.trim()
    if (term.length < 2) {
      setResults([])
      return
    }

    const controller = new AbortController()
    const timer = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(term)}&locale=${locale}`, {
        signal: controller.signal,
      })
        .then((r) => (r.ok ? r.json() : { results: [] }))
        .then((data) => {
          setResults(Array.isArray(data.results) ? data.results : [])
          setActive(-1)
        })
        .catch(() => {
          // Aborted, offline, or rate-limited: the form still works.
        })
    }, 250)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query, locale])

  // Dismiss on outside click and on Escape.
  useEffect(() => {
    if (!expanded) return
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setExpanded(false)
        setResults([])
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [expanded])

  const close = () => {
    setExpanded(false)
    setResults([])
    setActive(-1)
  }

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      close()
      inputRef.current?.blur()
      return
    }
    if (!results.length) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((i) => (i + 1) % results.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((i) => (i <= 0 ? results.length - 1 : i - 1))
    } else if (event.key === 'Enter' && active >= 0) {
      // Only intercept Enter when a suggestion is highlighted; otherwise let
      // the form submit normally to the full results page.
      event.preventDefault()
      router.push(results[active]!.href)
      close()
    }
  }

  return (
    <div ref={rootRef} className="relative">
      {/* Collapsed trigger, phones only. */}
      {!expanded && (
        <button
          type="button"
          aria-label={labels.open}
          onClick={() => {
            setExpanded(true)
            requestAnimationFrame(() => inputRef.current?.focus())
          }}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-charcoal-500 transition-colors hover:bg-charcoal-50 hover:text-maroon-800 focus-visible:ring-2 focus-visible:ring-maroon-700 md:hidden"
        >
          <SearchIcon />
        </button>
      )}

      <form
        method="GET"
        action="/search"
        role="search"
        onSubmit={close}
        className={`${expanded ? 'flex' : 'hidden'} items-center md:flex`}
      >
        <label htmlFor="header-search" className="sr-only">
          {labels.srLabel}
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-charcoal-400">
            <SearchIcon />
          </span>
          <input
            ref={inputRef}
            id="header-search"
            name="q"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={labels.placeholder}
            autoComplete="off"
            role="combobox"
            aria-expanded={results.length > 0}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-label={labels.srLabel}
            className="h-9 w-40 rounded-lg border border-charcoal-200 bg-white pl-9 pr-3 text-sm text-charcoal-900 placeholder-charcoal-400 transition focus:border-maroon-400 focus:outline-none focus:ring-2 focus:ring-maroon-200 lg:w-56"
          />
        </div>

        {expanded && (
          <button
            type="button"
            aria-label={labels.close}
            onClick={close}
            className="ms-1 inline-flex h-9 w-9 items-center justify-center rounded-lg text-charcoal-500 hover:bg-charcoal-50 md:hidden"
          >
            ✕
          </button>
        )}
      </form>

      {results.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          aria-label={labels.suggestions}
          className="absolute end-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-charcoal-100 bg-white py-1 shadow-lg"
        >
          {results.map((result, i) => (
            <li key={result.href} role="option" aria-selected={i === active}>
              <a
                href={result.href}
                onClick={close}
                onMouseEnter={() => setActive(i)}
                className={`flex items-center gap-2 px-3 py-2 text-sm ${
                  i === active ? 'bg-parchment-100 text-maroon-800' : 'text-charcoal-700'
                }`}
              >
                <span aria-hidden="true" className="shrink-0">
                  {result.icon}
                </span>
                <span className="truncate">{result.title}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function SearchIcon() {
  return (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
}

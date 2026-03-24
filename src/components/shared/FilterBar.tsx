'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useTransition } from 'react'

interface FilterOption {
  value: string
  label: string
}

interface FilterBarProps {
  options: FilterOption[]
  paramName: string
  className?: string
}

export function FilterBar({ options, paramName, className }: FilterBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const current = searchParams.get(paramName) ?? 'all'

  function setFilter(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all') {
      params.delete(paramName)
    } else {
      params.set(paramName, value)
    }
    params.delete('page')
    const qs = params.toString()
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname)
    })
  }

  return (
    <div
      className={`flex flex-wrap gap-2 mb-8 border-b border-charcoal-100 pb-4 ${isPending ? 'opacity-60 pointer-events-none' : ''} ${className ?? ''}`}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setFilter(opt.value)}
          aria-pressed={opt.value === current}
          className={
            opt.value === current
              ? 'rounded-full bg-maroon-800 px-4 py-1.5 text-sm font-medium text-white'
              : 'rounded-full border border-charcoal-200 px-4 py-1.5 text-sm font-medium text-charcoal-600 hover:border-maroon-300 hover:text-maroon-700 transition-colors'
          }
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

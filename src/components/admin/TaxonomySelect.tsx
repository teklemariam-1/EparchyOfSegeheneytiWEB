'use client'

/**
 * Admin dropdown whose options come from a taxonomy collection
 * (news-categories / event-types) instead of a hardcoded list, so editors
 * can add new categories/types without a code change.
 *
 * Used as a custom Field component on text fields via clientProps:
 *   { collectionSlug: 'news-categories', labelText: 'Category' }
 */

import React, { useEffect, useState } from 'react'
import { useField } from '@payloadcms/ui'

interface Option {
  label: string
  value: string
}

interface TaxonomySelectProps {
  path: string
  collectionSlug: string
  labelText: string
  required?: boolean
}

export const TaxonomySelect: React.FC<TaxonomySelectProps> = ({
  path,
  collectionSlug,
  labelText,
  required,
}) => {
  const { value, setValue } = useField<string | null>({ path })
  const [options, setOptions] = useState<Option[] | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/${collectionSlug}?limit=200&sort=id&depth=0`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data) => {
        if (cancelled) return
        const docs = Array.isArray(data?.docs) ? data.docs : []
        setOptions(
          docs
            .filter((d: any) => typeof d?.value === 'string' && d.value)
            .map((d: any) => ({ label: String(d.label ?? d.value), value: d.value })),
        )
      })
      .catch(() => {
        if (!cancelled) setOptions([])
      })
    return () => {
      cancelled = true
    }
  }, [collectionSlug])

  const loaded = options !== null
  const known = options ?? []
  // Keep a legacy/renamed value visible instead of silently blanking the field.
  const effective =
    value && !known.some((o) => o.value === value)
      ? [...known, { label: `${value} (unlisted)`, value }]
      : known

  return (
    <div className="field-type" style={{ marginBottom: 'var(--base, 24px)' }}>
      <label className="field-label" htmlFor={`field-${path}`}>
        {labelText}
        {required ? <span className="required">*</span> : null}
      </label>
      <select
        id={`field-${path}`}
        value={value ?? ''}
        disabled={!loaded}
        onChange={(e) => setValue(e.target.value || null)}
        style={{
          width: '100%',
          height: 'calc(var(--base, 24px) * 1.6667)',
          padding: '0 10px',
          background: 'var(--theme-input-bg, var(--theme-elevation-0, #fff))',
          color: 'var(--theme-elevation-800, #333)',
          border: '1px solid var(--theme-elevation-150, #dcdcdc)',
          borderRadius: 'var(--style-radius-s, 4px)',
          fontSize: '1rem',
        }}
      >
        <option value="">— None —</option>
        {effective.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export default TaxonomySelect

'use client'

import { useFormFields } from '@payloadcms/ui'
import { gregorianToGeezApprox } from '@/lib/formatters/date'
import { fixedSeasonOf } from '@/lib/geez-liturgical'
import { GEEZ_MONTHS, GEEZ_MONTH_LABELS } from '@/lib/constants/geezMonths'

/**
 * Rendered as the description under the obituary's opening paragraph: names
 * the liturgical season of the death date so the editor can replace the
 * ⟨ዘመነ/ወቕቲ⟩ placeholder without reaching for a calendar.
 *
 * A hint only, by design. It computes nothing into the document and can never
 * block saving: the conversion is the site's approximate one, and movable
 * seasons (Great Lent, Eastertide) are not guessed — for those it shows the
 * Ge'ez month instead and leaves the judgement to the editor.
 */
export function SeasonHint() {
  const deathDate = useFormFields(([fields]) => fields.deathDate?.value)

  let hint: string | null = null
  if (typeof deathDate === 'string' && deathDate) {
    const geez = gregorianToGeezApprox(deathDate)
    if (geez) {
      const month = GEEZ_MONTHS[geez.monthIndex]
      const season = month ? fixedSeasonOf(month, geez.day) : null
      if (season) {
        hint = `ወቕቲ ኣብ ዕለተ ዕረፍቲ፡ ${season.ti}`
      } else if (month) {
        hint = `ወቕቲ ኣብ ዕለተ ዕረፍቲ፡ ወርሒ ${GEEZ_MONTH_LABELS[month].ti} (ተንቀሳቓሲ ወቕቲ ባዕልኹም ኣረጋግጹ)`
      }
    }
  }

  if (!hint) return null

  return (
    <div style={{ fontSize: '0.8rem', opacity: 0.75, marginTop: '0.25rem' }}>
      {hint} — ሓበሬታ ጥራይ፣ እቲ ጽሑፍ ባዕልኹም ትጽሕፍዎ።
    </div>
  )
}

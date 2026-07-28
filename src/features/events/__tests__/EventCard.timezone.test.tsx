import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { EventCard } from '../EventCard'
import { localDateOf } from '@/lib/calendar-sync/config'
import { dayInZone } from '@/lib/formatters/eventTime'

/**
 * The regression this file exists for: a liturgy at 01:00 Asmara is 22:00 the
 * PREVIOUS day in UTC. The card used to derive its date badge with
 * `new Date(iso).getDate()`, which reads whichever zone the renderer is in — so
 * it printed the wrong day, and a different wrong day depending on the reader.
 *
 * Vitest runs in UTC-ish CI and on developer machines in other zones; the point
 * of these assertions is that the answer does not depend on which.
 */

const LATE_NIGHT_ASMARA = '2026-03-15T22:00:00.000Z' // 01:00 on 16 March in Asmara

const BASE = {
  slug: 'midnight-vigil',
  title: 'Midnight Vigil',
  excerpt: 'A late liturgy.',
  eventType: 'liturgical',
  startDate: LATE_NIGHT_ASMARA,
}

describe('the date badge', () => {
  it('shows 16, the Asmara day — not 15, the UTC day', () => {
    render(<EventCard event={BASE} />)
    expect(screen.getByText('16')).toBeInTheDocument()
    expect(screen.queryByText('15')).not.toBeInTheDocument()
  })

  it('shows the Asmara month', () => {
    render(<EventCard event={BASE} />)
    expect(screen.getByText('Mar')).toBeInTheDocument()
  })

  it('matches the day the ICS feed publishes for the same instant', () => {
    // The website and a subscriber's calendar must never name different days.
    render(<EventCard event={BASE} />)
    const feedDay = localDateOf(LATE_NIGHT_ASMARA) // 2026-03-16
    const shownDay = feedDay.slice(-2).replace(/^0/, '') // "16"
    expect(screen.getByText(shownDay)).toBeInTheDocument()
    expect(dayInZone(LATE_NIGHT_ASMARA)).toBe(feedDay)
  })

  it('renders an ordinary evening event on its own day', () => {
    render(<EventCard event={{ ...BASE, startDate: '2026-03-15T15:00:00.000Z' }} />)
    expect(screen.getByText('15')).toBeInTheDocument()
  })
})

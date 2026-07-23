import { describe, it, expect } from 'vitest'
import {
  webcalUrl,
  googleSubscribeUrl,
  outlookSubscribeUrl,
  googleEventUrl,
} from '../providers'

const FEED = 'https://example.org/api/calendar/liturgical.ics'

describe('subscribe links', () => {
  it('converts https to webcal', () => {
    expect(webcalUrl(FEED)).toBe('webcal://example.org/api/calendar/liturgical.ics')
  })

  it('builds a Google add-by-URL link with the webcal URL encoded', () => {
    const url = googleSubscribeUrl(FEED)
    expect(url.startsWith('https://calendar.google.com/calendar/r?cid=')).toBe(true)
    expect(url).toContain(encodeURIComponent('webcal://example.org/api/calendar/liturgical.ics'))
  })

  it('builds an Outlook subscribe link carrying url and name', () => {
    const url = new URL(outlookSubscribeUrl(FEED, 'Liturgical'))
    expect(url.searchParams.get('url')).toBe(FEED)
    expect(url.searchParams.get('name')).toBe('Liturgical')
  })
})

describe('googleEventUrl', () => {
  it('formats all-day events with an exclusive end date', () => {
    const url = new URL(
      googleEventUrl({ title: 'Meskel', start: '2026-09-27', allDay: true }),
    )
    expect(url.searchParams.get('action')).toBe('TEMPLATE')
    expect(url.searchParams.get('text')).toBe('Meskel')
    expect(url.searchParams.get('dates')).toBe('20260927/20260928')
  })

  it('formats multi-day all-day ranges', () => {
    const url = new URL(
      googleEventUrl({ title: 'Fast', start: '2026-11-25', end: '2026-12-05', allDay: true }),
    )
    expect(url.searchParams.get('dates')).toBe('20261125/20261206')
  })

  it('formats timed events in UTC and defaults a missing end to +1h', () => {
    const url = new URL(
      googleEventUrl({ title: 'Mass', start: '2026-03-01T09:30:00.000Z', allDay: false }),
    )
    expect(url.searchParams.get('dates')).toBe('20260301T093000Z/20260301T103000Z')
  })

  it('passes description and location through', () => {
    const url = new URL(
      googleEventUrl({
        title: 'T',
        start: '2026-01-01',
        allDay: true,
        description: 'Details',
        location: 'Segheneyti',
      }),
    )
    expect(url.searchParams.get('details')).toBe('Details')
    expect(url.searchParams.get('location')).toBe('Segheneyti')
  })
})

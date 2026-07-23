/**
 * Feed registry — the single catalog of subscribable calendars.
 *
 * Every feed here is a standing public URL that subscribed clients poll for
 * years, so ids are permanent API contracts: add new entries freely, never
 * rename or remove existing ones. The Subscription Center page and the
 * /api/calendar/[feed] route both render from this registry.
 */

import {
  getGeezDaysForFeeds,
  getGeezMonthlyFeasts,
  getEventsForCalendarFeed,
} from '@/lib/payload/queries'
import type { CalendarEvent } from './ics'
import {
  feastEvents,
  monthlyFeastEvents,
  fastingSeasonEvents,
  eventDocToCalendarEvent,
} from './mappers'

export interface FeedParams {
  /** Parish slug filter (events feed only). */
  parish?: string
}

export interface FeedDef {
  /** Permanent id; also the .ics filename. */
  id: string
  title: { en: string; ti: string }
  description: { en: string; ti: string }
  /** Whether the ?parish= filter applies. */
  supportsParish?: boolean
  build: (params: FeedParams) => Promise<CalendarEvent[]>
}

export const FEEDS: FeedDef[] = [
  {
    id: 'liturgical',
    title: { en: "Ge'ez Liturgical Calendar", ti: 'ናይ ግዕዝ ስርዓተ-ኣምልኾ ዓውደ-ኣዋርሕ' },
    description: {
      en: 'Feast days, monthly commemorations and fasting seasons of the Ge\'ez calendar.',
      ti: 'በዓላት፣ ወርሓዊ ዝኽርታትን ኣጽዋማትን ናይ ግዕዝ ዓውደ-ኣዋርሕ።',
    },
    build: async () => {
      const [days, monthly] = await Promise.all([getGeezDaysForFeeds(), getGeezMonthlyFeasts()])
      return [
        ...feastEvents(days),
        ...monthlyFeastEvents(days, monthly),
        ...fastingSeasonEvents(days),
      ]
    },
  },
  {
    id: 'feasts',
    title: { en: 'Feast Days', ti: 'በዓላት' },
    description: {
      en: 'Annual feast days and monthly commemorations only.',
      ti: 'ዓመታዊ በዓላትን ወርሓዊ ዝኽርታትን ጥራይ።',
    },
    build: async () => {
      const [days, monthly] = await Promise.all([getGeezDaysForFeeds(), getGeezMonthlyFeasts()])
      return [...feastEvents(days), ...monthlyFeastEvents(days, monthly)]
    },
  },
  {
    id: 'fasting',
    title: { en: 'Fasting Seasons', ti: 'ኣጽዋማት' },
    description: {
      en: 'Fixed fasting seasons (Advent Fast, Assumption Fast).',
      ti: 'ቀዋሚ ኣጽዋማት (ጾመ ልደት፣ ጾመ ፍልሰታ)።',
    },
    build: async () => fastingSeasonEvents(await getGeezDaysForFeeds()),
  },
  {
    id: 'events',
    title: { en: 'Eparchy Events', ti: 'ናይ ኤጳርቅና ኣጋጣሚታት' },
    description: {
      en: 'Eparchy-wide and parish events. Filter to one parish with ?parish=<slug>.',
      ti: 'ኣጋጣሚታት ኤጳርቅናን ቁምስናታትን። ንሓደ ቁምስና ብ ?parish=<slug> ኣጻርዩ።',
    },
    supportsParish: true,
    build: async ({ parish }) =>
      (await getEventsForCalendarFeed(parish)).map(eventDocToCalendarEvent),
  },
]

export function getFeed(id: string): FeedDef | undefined {
  return FEEDS.find((f) => f.id === id)
}

/**
 * Shared TypeScript types for Ge'ez calendar domain.
 * These are the application-layer types (not Payload-generated).
 */

import type { GeezMonth, FeastRank, FastingSeason, LiturgicalColor } from '@/lib/constants/geezMonths'

export interface GeezCalendarEntry {
  id: string
  title: string
  slug: string

  geezYear: number
  geezMonth: GeezMonth
  geezDay: number
  gregorianDate: string // ISO date string

  feastName: {
    en: string
    ti?: string
  }
  feastRank: FeastRank

  saintOfTheDay?: {
    name: { en: string; ti?: string }
    biography?: string // richtext HTML
  }

  fastingSeason: FastingSeason
  isFastingDay: boolean
  liturgicalColor: LiturgicalColor

  readings?: Array<{
    label: string     // e.g. "First Reading"
    citation: string  // e.g. "Isaiah 9:1-6"
    text?: string
  }>

  reflection?: string  // richtext HTML

  category: 'sunday' | 'weekday' | 'feast' | 'fast' | 'special'
  isRecurring: boolean
  status: 'draft' | 'published'
}

export type GeezCalendarPreview = Pick<
  GeezCalendarEntry,
  'id' | 'slug' | 'title' | 'geezYear' | 'geezMonth' | 'geezDay' |
  'gregorianDate' | 'feastName' | 'feastRank' | 'isFastingDay' |
  'liturgicalColor' | 'category'
>

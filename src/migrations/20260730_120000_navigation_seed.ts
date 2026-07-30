import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-postgres'

/**
 * Seed the Navigation global with the structure that was hardcoded in
 * MainNav/MobileMenu, so the header renders identically the moment the
 * frontend switches to reading the global — and admins start from the real
 * menu instead of an empty list.
 *
 * Labels are localized: English is written first (creating the array rows),
 * then the same rows are re-written in Tigrinya using the row ids Payload
 * assigned.
 *
 * The seed REPLACES whatever the global holds: before this feature nothing
 * rendered the global, so any pre-existing rows are unrenderable test data
 * from the admin UI (production held exactly one: label "poppp"), not real
 * navigation. Admin edits made after this ships are safe — a migration runs
 * once per environment.
 */

interface SeedChild {
  en: string
  ti: string
  url: string
}
interface SeedItem {
  en: string
  ti: string
  url?: string
  children?: SeedChild[]
}

const SEED: SeedItem[] = [
  { en: 'Home', ti: 'ቤት', url: '/' },
  {
    en: 'About',
    ti: 'ብዛዕባና',
    url: '/about',
    children: [
      { en: 'About the Eparchy', ti: 'ብዛዕባ ኤጳርቅና', url: '/about' },
      { en: 'Bishop', ti: 'ጳጳስ', url: '/bishop' },
      { en: 'History', ti: 'ታሪኽ', url: '/about#history' },
    ],
  },
  { en: 'Vicariates', ti: 'ቪካርያታት', url: '/vicariates' },
  { en: 'Parishes', ti: 'ሰበካት', url: '/parishes' },
  { en: 'News', ti: 'ዜናታት', url: '/news' },
  { en: 'Events', ti: 'ኣጋጣሚታት', url: '/events' },
  {
    en: 'Ministries',
    ti: 'ኣገልግሎታት',
    url: '/ministries',
    children: [
      { en: 'All Ministries', ti: 'ኩሎም ኣገልግሎታት', url: '/ministries' },
      { en: 'Youth Council', ti: 'ምኽሪ መንእሰያት', url: '/offices/youth-council' },
      { en: 'Catechists', ti: 'ካቴኬስታት', url: '/ministries#catechists' },
      { en: "Children's Ministry", ti: 'ኣገልጎሎት ሕፃናት', url: '/ministries#children' },
      {
        en: 'Small Christian Community',
        ti: 'ማሕበር ንኡስ ክርስትያን',
        url: '/ministries#small-christian-community',
      },
    ],
  },
  {
    en: 'Resources',
    ti: 'ትሕዝቶታት',
    url: '/publications',
    children: [
      { en: "Bishop's Messages", ti: 'መልእኽቲ ጳጳስ', url: '/bishop-messages' },
      { en: 'Pope Messages', ti: 'መልእኽቲ ር.ሊ.ጳጳሳት', url: '/pope-messages' },
      { en: "Ge'ez Calendar", ti: 'ዕለታት ግዕዝ', url: '/geez-calendar' },
      { en: 'Publications', ti: 'ሕትመታት', url: '/publications' },
      { en: 'Magazines', ti: 'መፅሔታት', url: '/publications#magazines' },
      { en: 'Archives', ti: 'ሰነዳት', url: '/publications#archives' },
      { en: 'Apps & Downloads', ti: 'መተግበሪታት', url: '/apps' },
    ],
  },
  { en: 'Media', ti: 'ሚዲያ', url: '/media' },
  { en: 'Contact', ti: 'ርክብ', url: '/contact' },
]

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  const updated = (await payload.updateGlobal({
    slug: 'navigation',
    locale: 'en',
    depth: 0,
    data: {
      mainNav: SEED.map((item) => ({
        label: item.en,
        url: item.url,
        openInNewTab: false,
        children: (item.children ?? []).map((c) => ({
          label: c.en,
          url: c.url,
          openInNewTab: false,
        })),
      })),
    } as any,
  } as any)) as any

  // Second pass: same rows (matched by the ids Payload just assigned), Tigrinya
  // labels. Order is preserved by updateGlobal, so index-matching is safe here.
  await payload.updateGlobal({
    slug: 'navigation',
    locale: 'ti',
    depth: 0,
    data: {
      mainNav: (updated.mainNav as any[]).map((row, i) => ({
        id: row.id,
        label: SEED[i]?.ti ?? row.label,
        url: row.url,
        openInNewTab: row.openInNewTab,
        children: (row.children ?? []).map((childRow: any, j: number) => ({
          id: childRow.id,
          label: SEED[i]?.children?.[j]?.ti ?? childRow.label,
          url: childRow.url,
          openInNewTab: childRow.openInNewTab,
        })),
      })),
    } as any,
  } as any)
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // Intentionally a no-op: by the time a rollback runs, admins may have edited
  // the navigation, and deleting their content would be destructive. The
  // frontend falls back to the built-in structure if the global is emptied.
}

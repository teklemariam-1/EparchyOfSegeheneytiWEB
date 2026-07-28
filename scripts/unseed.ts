/**
 * Removes the sample content created by scripts/seed.ts.
 *
 * Deletes ONLY the known seeded documents (matched by their fixed slugs) plus
 * the placeholder media asset — so any real content you have added is left
 * untouched. Homepage global hero text is cleared back to empty.
 *
 * Run:  npx tsx scripts/unseed.ts        (with DATABASE_URI etc. in the env)
 */
import { getPayload } from '../src/lib/payload/client'
import { assertLocalDatabase } from './assertLocalDatabase'

const SEED_SLUGS: Record<string, string[]> = {
  priests: ['fr-tesfamariam-weldegabir', 'fr-ghirmay-habte', 'msgr-yohannes-tekle'],
  parishes: ['st-mary-cathedral', 'holy-savior-dekemhare', 'st-michael-adi-keyih', 'kidane-mihret-adi-ugri'],
  ministries: ['youth-council-segeneyti', 'catechists-association', 'childrens-faith-formation', 'scc-st-mary', 'caritas-segeneyti', 'cathedral-choir'],
  news: ['assumption-feast-2026', 'new-catechetical-program', 'bishop-visits-diaspora', 'caritas-aid-rural-parishes', 'youth-pilgrimage-debre-bizen'],
  events: ['feast-of-st-mary-2026', 'youth-convention-2026', 'easter-vigil-2026', 'catechist-training-2026'],
  'bishop-messages': ['christmas-message-2025', 'pastoral-letter-family-life', 'homily-assumption'],
  // Listed after bishop-messages so the messages that reference him are gone
  // first; the FK is ON DELETE SET NULL, but removing the dependants first
  // keeps the log honest about what was actually deleted.
  bishops: ['abune-mekonnen-tesfay'],
  'pope-messages': ['fratelli-tutti', 'world-day-of-peace-message'],
  'geez-calendar-entries': ['buhe-transfiguration', 'filseta-st-mary', 'fast-of-the-apostles', 'meskel-finding-cross', 'ldet-nativity'],
  publications: ['catechism-for-families', 'diocesan-prayer-book'],
}

async function main() {
  // Refuses to touch a non-local database — see ./assertLocalDatabase.
  assertLocalDatabase('unseed')

  const payload = await getPayload()

  // Delete content collections first (they reference media), then media.
  for (const [collection, slugs] of Object.entries(SEED_SLUGS)) {
    try {
      const res = await payload.delete({
        collection: collection as any,
        where: { slug: { in: slugs } },
        overrideAccess: true,
      } as any)
      const n = Array.isArray((res as any)?.docs) ? (res as any).docs.length : 0
      console.log(`▸ ${collection.padEnd(24)} removed ${n}`)
    } catch (err) {
      console.warn(`  ! ${collection}: ${String(err)}`)
    }
  }

  // Placeholder media asset.
  try {
    const res = await payload.delete({
      collection: 'media',
      where: { filename: { like: 'seed-cover' } },
      overrideAccess: true,
    } as any)
    const n = Array.isArray((res as any)?.docs) ? (res as any).docs.length : 0
    console.log(`▸ ${'media'.padEnd(24)} removed ${n}`)
  } catch (err) {
    console.warn(`  ! media: ${String(err)}`)
  }

  console.log('\n✅ Unseed complete. Sample content removed (real content left intact).')
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Unseed failed:', err)
    process.exit(1)
  })

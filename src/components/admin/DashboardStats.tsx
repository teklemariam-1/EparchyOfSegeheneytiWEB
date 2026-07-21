import { getPayload } from '@/lib/payload/client'

/**
 * Statistics panel shown at the top of the admin dashboard.
 *
 * A server component: it counts each collection with the local API and renders
 * a set of linked cards, plus a visitors-by-country section fed by the
 * lightweight tracker (see /api/track and the VisitorStats collection). Every
 * count is wrapped so one failing query never blanks the whole dashboard.
 */

async function safeCount(
  payload: Awaited<ReturnType<typeof getPayload>>,
  collection: string,
  where?: Record<string, unknown>,
): Promise<number> {
  try {
    const r = await payload.count({ collection, ...(where ? { where } : {}), overrideAccess: true } as any)
    return r.totalDocs ?? 0
  } catch {
    return -1
  }
}

interface Stat {
  label: string
  value: number
  href: string
  tone?: 'default' | 'alert' | 'accent'
}

function StatCard({ label, value, href, tone = 'default' }: Stat) {
  const border =
    tone === 'alert'
      ? 'var(--theme-error-500, #b3261e)'
      : tone === 'accent'
        ? 'var(--theme-success-500, #2e7d32)'
        : 'var(--theme-elevation-150)'
  return (
    <a
      href={href}
      style={{
        display: 'block',
        padding: '16px 18px',
        borderRadius: 8,
        border: `1px solid ${border}`,
        borderLeft: `4px solid ${border}`,
        background: 'var(--theme-elevation-50)',
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.1 }}>
        {value < 0 ? '—' : value.toLocaleString()}
      </div>
      <div style={{ fontSize: 13, opacity: 0.75, marginTop: 4 }}>{label}</div>
    </a>
  )
}

const FLAGS: Record<string, string> = {
  ER: '🇪🇷', US: '🇺🇸', IT: '🇮🇹', GB: '🇬🇧', DE: '🇩🇪', CA: '🇨🇦', SE: '🇸🇪',
  AU: '🇦🇺', NL: '🇳🇱', ET: '🇪🇹', SA: '🇸🇦', AE: '🇦🇪', IL: '🇮🇱', NO: '🇳🇴',
}

export default async function DashboardStats() {
  const payload = await getPayload()

  const [
    news, newsDrafts, events, parishes, vicariates, priests,
    popeMsgs, bishopMsgs, subscribers, contactNew, media,
  ] = await Promise.all([
    safeCount(payload, 'news'),
    safeCount(payload, 'news', { _status: { equals: 'draft' } }),
    safeCount(payload, 'events'),
    safeCount(payload, 'parishes'),
    safeCount(payload, 'vicariates'),
    safeCount(payload, 'priests'),
    safeCount(payload, 'pope-messages'),
    safeCount(payload, 'bishop-messages'),
    safeCount(payload, 'subscribers', { status: { equals: 'confirmed' } }),
    safeCount(payload, 'contact-submissions', { status: { equals: 'new' } }),
    safeCount(payload, 'media'),
  ])

  const content: Stat[] = [
    { label: 'News articles', value: news, href: '/admin/collections/news' },
    { label: 'Drafts awaiting review', value: newsDrafts, href: '/admin/collections/news?where[or][0][and][0][_status][equals]=draft', tone: newsDrafts > 0 ? 'accent' : 'default' },
    { label: 'Events', value: events, href: '/admin/collections/events' },
    { label: 'Parishes', value: parishes, href: '/admin/collections/parishes' },
    { label: 'Vicariates', value: vicariates, href: '/admin/collections/vicariates' },
    { label: 'Priests', value: priests, href: '/admin/collections/priests' },
    { label: 'Pope messages', value: popeMsgs, href: '/admin/collections/pope-messages' },
    { label: 'Bishop messages', value: bishopMsgs, href: '/admin/collections/bishop-messages' },
    { label: 'Confirmed subscribers', value: subscribers, href: '/admin/collections/subscribers' },
    { label: 'Unread messages', value: contactNew, href: '/admin/collections/contact-submissions?where[or][0][and][0][status][equals]=new', tone: contactNew > 0 ? 'alert' : 'default' },
    { label: 'Media files', value: media, href: '/admin/collections/media' },
  ]

  // Visitors by country (last 30 days), from the lightweight tracker.
  let visitorRows: Array<{ country: string; total: number }> = []
  let visitorTotal = 0
  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const vs = await payload.find({
      collection: 'visitor-stats',
      where: { date: { greater_than_equal: since } },
      limit: 1000,
      depth: 0,
      overrideAccess: true,
    } as any)
    const byCountry = new Map<string, number>()
    for (const d of vs.docs as any[]) {
      const c = d.country || 'Unknown'
      const n = Number(d.count) || 0
      byCountry.set(c, (byCountry.get(c) ?? 0) + n)
      visitorTotal += n
    }
    visitorRows = [...byCountry.entries()]
      .map(([country, total]) => ({ country, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
  } catch {
    visitorRows = []
  }

  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 12px' }}>At a glance</h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: 12,
        }}
      >
        {content.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      <h2 style={{ fontSize: 18, fontWeight: 700, margin: '28px 0 12px' }}>
        Visitors by country{' '}
        <span style={{ fontSize: 13, fontWeight: 400, opacity: 0.6 }}>· last 30 days</span>
      </h2>
      {visitorTotal > 0 ? (
        <div style={{ maxWidth: 520 }}>
          <div style={{ fontSize: 14, opacity: 0.75, marginBottom: 10 }}>
            {visitorTotal.toLocaleString()} total visits
          </div>
          {visitorRows.map((r) => {
            const pct = Math.round((r.total / visitorTotal) * 100)
            return (
              <div key={r.country} style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '6px 0' }}>
                <span style={{ width: 90, fontSize: 13 }}>
                  {FLAGS[r.country] ?? '🏳️'} {r.country}
                </span>
                <div style={{ flex: 1, height: 10, borderRadius: 999, background: 'var(--theme-elevation-100)' }}>
                  <div style={{ width: `${pct}%`, height: '100%', borderRadius: 999, background: 'var(--theme-success-500, #2e7d32)' }} />
                </div>
                <span style={{ width: 64, textAlign: 'right', fontSize: 13 }}>
                  {r.total.toLocaleString()} · {pct}%
                </span>
              </div>
            )
          })}
        </div>
      ) : (
        <p style={{ fontSize: 13, opacity: 0.7, maxWidth: 560, lineHeight: 1.6 }}>
          No visitor data yet. Visits are counted anonymously by country once the site receives
          public traffic — no personal data or IP addresses are stored.
        </p>
      )}
    </div>
  )
}

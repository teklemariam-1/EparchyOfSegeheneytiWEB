import React from 'react'
import {
  resolveDateRange,
  countryName,
  countryFlag,
  SOURCE_LABELS,
  LANGUAGE_LABELS,
  type TrafficSource,
} from '@/lib/analytics'
import {
  getVisitorAnalytics,
  getContentStats,
  getEngagementStats,
  getMediaStats,
  getUserSecurityStats,
  getDonationStats,
} from '@/lib/payload/analytics-queries'
import { LineChart, DonutChart, BarList, CHART_COLORS } from './charts'
import { DateRangeControls } from './DateRangeControls'
import { ExportPdfButton } from './ExportPdfButton'
import { CountryTable } from './CountryTable'
import { GroupedTable } from '../shared/GroupedTable'
import type { GroupFilter } from '@/lib/payload/aggregationConfig'

function todayIsoAsmara(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Asmara' }).format(new Date())
}

function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

function Section({ title, children, hint }: { title: string; children: React.ReactNode; hint?: string }) {
  return (
    <section
      className="analytics-section"
      style={{
        border: '1px solid var(--theme-elevation-100)',
        borderRadius: 10,
        background: 'var(--theme-elevation-0)',
        padding: '18px 20px',
        breakInside: 'avoid',
      }}
    >
      <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 4px', color: 'var(--theme-elevation-800)' }}>{title}</h2>
      {hint && <p style={{ fontSize: 12, margin: '0 0 12px', color: 'var(--theme-elevation-450)' }}>{hint}</p>}
      {!hint && <div style={{ height: 8 }} />}
      {children}
    </section>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div
      style={{
        padding: '14px 16px',
        borderRadius: 10,
        border: '1px solid var(--theme-elevation-100)',
        borderLeft: '4px solid #2e7d32',
        background: 'var(--theme-elevation-0)',
        breakInside: 'avoid',
      }}
    >
      <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.1, color: 'var(--theme-elevation-800)' }}>{value}</div>
      <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, opacity: 0.55, marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

/**
 * Superadmin analytics dashboard: anonymous visitor analytics, content and
 * engagement statistics with date filtering and a printable PDF report.
 */
export async function AnalyticsDashboard({
  searchParams,
  canViewSecurity = false,
}: {
  searchParams?: Record<string, string | string[] | undefined>
  /** Gate the "Users & security" section — held only by users.manage (super-admin). */
  canViewSecurity?: boolean
}) {
  const p = (k: string) => {
    const v = searchParams?.[k]
    return Array.isArray(v) ? v[0] : v
  }
  const today = todayIsoAsmara()
  const range = resolveDateRange(p('range'), today, p('from'), p('to'))

  const [visitors, content, engagement, media, security, donations] = await Promise.all([
    getVisitorAnalytics(range.from, range.to),
    getContentStats(),
    getEngagementStats(range.from, range.to),
    getMediaStats(),
    getUserSecurityStats(),
    getDonationStats(range.from, range.to, today),
  ])

  const donationTotalLabel =
    donations.totalsByCurrency.length > 0
      ? donations.totalsByCurrency.map((t) => `${t.sum.toLocaleString()} ${t.currency}`).join(' · ')
      : '—'

  const days = Math.max(visitors.daily.length, 1)
  const pagesPerVisit = visitors.sessions > 0 ? (visitors.pageViews / visitors.sessions).toFixed(1) : '—'

  const countryRows = visitors.byCountry.map((c) => ({
    code: c.code,
    name: countryName(c.code),
    flag: countryFlag(c.code),
    count: c.count,
    pct: visitors.sessions > 0 ? Math.round((c.count / visitors.sessions) * 100) : 0,
    daily: c.daily,
  }))

  const detailPaths = (prefix: string) =>
    visitors.topPaths
      .filter((t) => t.path.startsWith(`${prefix}/`) && t.path.length > prefix.length + 1)
      .slice(0, 5)
      .map((t) => ({ label: t.path.slice(prefix.length + 1).replace(/-/g, ' '), value: t.count, hint: t.path }))

  const mostViewedGroups = [
    { title: 'News articles', items: detailPaths('/news') },
    { title: 'Events', items: detailPaths('/events') },
    { title: 'Parishes', items: detailPaths('/parishes') },
    { title: 'Bishop messages', items: detailPaths('/bishop-messages') },
    { title: 'Pope messages', items: detailPaths('/pope-messages') },
    {
      title: 'Publications & magazines',
      items: visitors.topPaths
        .filter((t) => t.path.startsWith('/publications'))
        .slice(0, 5)
        .map((t) => ({ label: t.path === '/publications' ? 'Publications page' : t.path, value: t.count })),
    },
  ].filter((g) => g.items.length > 0)

  const generatedAt = new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Africa/Asmara',
  }).format(new Date())

  const grid = (min: number): React.CSSProperties => ({
    display: 'grid',
    gridTemplateColumns: `repeat(auto-fill, minmax(${min}px, 1fr))`,
    gap: 12,
  })

  return (
    <div id="analytics-report" style={{ display: 'grid', gap: 16 }}>
      {/* Print-only report header */}
      <div className="analytics-print-header" style={{ display: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: '2px solid #911e1e', paddingBottom: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 28 }}>✝</span>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>Catholic Eparchy of Segheneyti</div>
            <div style={{ fontSize: 13 }}>Website Analytics Report — {range.label}</div>
            <div style={{ fontSize: 11, opacity: 0.7 }}>
              Generated {generatedAt} (Asmara time) · eparchy-of-segeheneyti-web.vercel.app
            </div>
          </div>
        </div>
      </div>

      {/* Screen header */}
      <div
        className="analytics-screen-header"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}
      >
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: 'var(--theme-elevation-800)' }}>Analytics</h1>
          <p style={{ fontSize: 12, margin: '2px 0 0', color: 'var(--theme-elevation-450)' }}>
            {range.label} · anonymous aggregates, no personal data
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <DateRangeControls current={range.key} customFrom={range.from ?? undefined} customTo={range.to} />
          <ExportPdfButton />
        </div>
      </div>

      {/* Summary cards */}
      <div style={grid(150)}>
        <StatCard label="Visitors (sessions)" value={visitors.sessions.toLocaleString()} sub={`≈ ${Math.round(visitors.sessions / days)} / day`} />
        <StatCard label="Page views" value={visitors.pageViews.toLocaleString()} sub="collected since the page-view tracker launched" />
        <StatCard label="Pages per visit" value={String(pagesPerVisit)} />
        <StatCard label="Countries reached" value={String(countryRows.length)} />
        <StatCard label="New subscribers" value={engagement.subscribersInRange.toLocaleString()} sub={`${engagement.subscribersConfirmed.toLocaleString()} confirmed total`} />
        <StatCard label="Contact messages" value={engagement.contactInRange.toLocaleString()} sub={`${engagement.contactUnread} unread`} />
      </div>

      <Section title="Visitors over time" hint="Daily sessions and page views in the selected range.">
        <LineChart
          labels={visitors.daily.map((d) => d.date)}
          series={[
            { label: 'Visitors', color: CHART_COLORS[0]!, points: visitors.daily.map((d) => d.sessions) },
            { label: 'Page views', color: CHART_COLORS[1]!, points: visitors.daily.map((d) => d.views) },
          ]}
        />
      </Section>

      <div style={grid(320)}>
        <Section title="Devices" hint="Desktop vs mobile vs tablet (per session).">
          <DonutChart data={visitors.byDevice.map((d) => ({ label: d.key, value: d.count }))} />
        </Section>
        <Section title="Traffic sources" hint="Where sessions arrived from.">
          <DonutChart
            data={visitors.bySource.map((s) => ({
              label: SOURCE_LABELS[s.key as TrafficSource] ?? s.key,
              value: s.count,
            }))}
          />
        </Section>
        <Section title="Languages" hint="Visitors' preferred browser language.">
          <BarList
            color={CHART_COLORS[3]}
            items={visitors.byLanguage.slice(0, 8).map((l) => ({
              label: LANGUAGE_LABELS[l.key] ?? l.key,
              value: l.count,
            }))}
          />
        </Section>
      </div>

      <Section title="Visitors by country" hint="Click a country for its daily trend. Search to filter.">
        <CountryTable rows={countryRows} />
      </Section>

      <Section
        title="Group & aggregate"
        hint="Pick one or more columns to group by (dimension, key, country, date). Rows shows the number of underlying records; the measure column sums visits/views. Respects the date range above."
      >
        <GroupedTable
          collection="visitor-stats"
          initialGroupBy={['dimension']}
          initialBucket="month"
          baseFilters={
            [
              { key: 'date', op: 'lte', value: `${range.to}T23:59:59.999Z` },
              ...(range.from ? [{ key: 'date', op: 'gte', value: `${range.from}T00:00:00.000Z` }] : []),
            ] as GroupFilter[]
          }
        />
      </Section>

      <div style={grid(320)}>
        <Section title="Popular content areas" hint="Page views grouped by section.">
          <BarList color={CHART_COLORS[2]} items={visitors.byBucket.slice(0, 10).map((b) => ({ label: b.bucket, value: b.count }))} />
        </Section>
        <Section title="Most viewed pages">
          <BarList
            color={CHART_COLORS[5]}
            items={visitors.topPaths.slice(0, 10).map((t) => ({ label: t.path, value: t.count }))}
          />
        </Section>
      </div>

      {mostViewedGroups.length > 0 && (
        <Section title="Most viewed by type" hint="Top individual pages per content type.">
          <div style={grid(300)}>
            {mostViewedGroups.map((g) => (
              <div key={g.title}>
                <h3 style={{ fontSize: 13, fontWeight: 700, margin: '0 0 8px', color: 'var(--theme-elevation-650)' }}>{g.title}</h3>
                <BarList color={CHART_COLORS[6]} items={g.items} />
              </div>
            ))}
          </div>
        </Section>
      )}

      <div style={grid(320)}>
        <Section title="Top searches" hint="What visitors searched for on the site.">
          <BarList color={CHART_COLORS[4]} items={visitors.topSearches.map((s) => ({ label: s.term, value: s.count }))} emptyText="No searches recorded in this range yet." />
        </Section>
        <Section title="Searches with no results" hint="Content gaps worth filling.">
          <BarList color={CHART_COLORS[7]} items={visitors.emptySearches.map((s) => ({ label: s.term, value: s.count }))} emptyText="No empty searches — every search found something." />
        </Section>
      </div>

      <Section title="Content statistics" hint="Totals across the CMS.">
        <div style={grid(300)}>
          {content.groups.map((g) => (
            <div key={g.title}>
              <h3 style={{ fontSize: 13, fontWeight: 700, margin: '0 0 8px', color: 'var(--theme-elevation-650)' }}>{g.title}</h3>
              <div style={{ display: 'grid', gap: 4 }}>
                {g.items.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, textDecoration: 'none', color: 'var(--theme-elevation-650)', padding: '4px 6px', borderRadius: 4 }}
                  >
                    <span>{item.label}</span>
                    <span style={{ fontWeight: 700, color: 'var(--theme-elevation-800)' }}>
                      {item.value < 0 ? '—' : item.value.toLocaleString()}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <div style={grid(320)}>
        <Section title="Media library">
          <div style={{ display: 'grid', gap: 6, fontSize: 13, color: 'var(--theme-elevation-650)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Images</span><b>{media.images.toLocaleString()}</b></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Documents (PDF)</span><b>{media.documents.toLocaleString()}</b></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Other files</span><b>{media.other.toLocaleString()}</b></div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Restricted files</span><b>{media.restricted.toLocaleString()}</b></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--theme-elevation-100)', paddingTop: 6 }}>
              <span>Total storage used</span><b>{formatBytes(media.storageBytes)}</b>
            </div>
          </div>
          {media.recentUploads.length > 0 && (
            <>
              <h3 style={{ fontSize: 12, fontWeight: 700, margin: '12px 0 6px', color: 'var(--theme-elevation-500)' }}>Recent uploads</h3>
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: 'var(--theme-elevation-650)' }}>
                {media.recentUploads.map((u) => (
                  <li key={u.filename}>
                    {u.filename} <span style={{ opacity: 0.6 }}>· {u.createdAt.slice(0, 10)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Section>

        {canViewSecurity && (
        <Section title="Users & security" hint="Visible to user administrators only.">
          <div style={{ display: 'grid', gap: 6, fontSize: 13, color: 'var(--theme-elevation-650)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Registered users</span><b>{security.totalUsers < 0 ? '—' : security.totalUsers}</b></div>
            {security.byRole.map((r) => (
              <div key={r.role} style={{ display: 'flex', justifyContent: 'space-between', paddingLeft: 12 }}>
                <span>{r.role}</span><b>{r.count}</b>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--theme-elevation-100)', paddingTop: 6 }}>
              <span>Currently locked accounts</span>
              <b style={{ color: security.lockedAccounts > 0 ? '#b3261e' : undefined }}>{security.lockedAccounts}</b>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Accounts with recent failed logins</span>
              <b style={{ color: security.accountsWithFailedAttempts > 0 ? '#b45309' : undefined }}>{security.accountsWithFailedAttempts}</b>
            </div>
          </div>
          {security.recentChanges.length > 0 && (
            <>
              <h3 style={{ fontSize: 12, fontWeight: 700, margin: '12px 0 6px', color: 'var(--theme-elevation-500)' }}>Recently updated content</h3>
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: 'var(--theme-elevation-650)' }}>
                {security.recentChanges.map((c) => (
                  <li key={`${c.type}-${c.title}`}>
                    <a href={c.href} style={{ color: 'inherit' }}>
                      {c.type}: {c.title}
                    </a>{' '}
                    <span style={{ opacity: 0.6 }}>· {c.updatedAt.slice(0, 10)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Section>
        )}
      </div>

      {/* ── Donations ────────────────────────────────────────────────────── */}
      <div style={grid(150)}>
        <StatCard label="Total raised (all-time)" value={donationTotalLabel} />
        <StatCard label="Donations" value={donations.countAllTime.toLocaleString()} sub={`${donations.pendingCount} pending`} />
        <StatCard label="This year" value={donations.countYear.toLocaleString()} />
        <StatCard label="This month" value={donations.countMonth.toLocaleString()} sub={`${donations.countToday} today`} />
        <StatCard label="Unique donors" value={donations.uniqueDonors.toLocaleString()} />
        <StatCard
          label="Average gift"
          value={
            donations.totalsByCurrency.length === 1 && donations.totalsByCurrency[0]!.count > 0
              ? `${Math.round(donations.totalsByCurrency[0]!.sum / donations.totalsByCurrency[0]!.count).toLocaleString()} ${donations.totalsByCurrency[0]!.currency}`
              : '—'
          }
          sub={donations.totalsByCurrency.length > 1 ? 'multiple currencies' : undefined}
        />
      </div>

      {donations.daily.length > 0 && (
        <Section title="Donations over time" hint="Daily donation count in the selected range.">
          <LineChart
            labels={donations.daily.map((d) => d.date)}
            series={[{ label: 'Donations', color: CHART_COLORS[2]!, points: donations.daily.map((d) => d.count) }]}
          />
        </Section>
      )}

      <div style={grid(340)}>
        <Section title="Recent donations" hint="Anonymous donors are shown as “Anonymous”.">
          {donations.recent.length === 0 ? (
            <p style={{ fontSize: 13, opacity: 0.6 }}>No donations recorded yet.</p>
          ) : (
            <div style={{ display: 'grid', gap: 4, fontSize: 13 }}>
              {donations.recent.map((d, i) => (
                <div
                  key={i}
                  style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '4px 0', borderBottom: '1px solid var(--theme-elevation-50)' }}
                >
                  <span style={{ color: 'var(--theme-elevation-700)' }}>
                    {d.name}
                    <span style={{ opacity: 0.55, marginLeft: 6 }}>
                      {d.createdAt.slice(0, 10)}
                      {d.status !== 'received' ? ` · ${d.status}` : ''}
                    </span>
                  </span>
                  <b style={{ whiteSpace: 'nowrap' }}>
                    {d.amount.toLocaleString()} {d.currency}
                    {d.frequency === 'monthly' ? '/mo' : ''}
                  </b>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Total raised by currency">
          {donations.totalsByCurrency.length === 0 ? (
            <p style={{ fontSize: 13, opacity: 0.6 }}>No donations recorded yet.</p>
          ) : (
            <div style={{ display: 'grid', gap: 6, fontSize: 13 }}>
              {donations.totalsByCurrency.map((t) => (
                <div key={t.currency} style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>
                    {t.currency} <span style={{ opacity: 0.55 }}>· {t.count} gift{t.count === 1 ? '' : 's'}</span>
                  </span>
                  <b>{t.sum.toLocaleString()}</b>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>

      <Section
        title="Donations — group & aggregate"
        hint="Group by date, currency, method, status or frequency. Rows counts donations; Amount raised sums them (group by currency to keep currencies separate)."
      >
        <GroupedTable collection="donations" initialGroupBy={['currency']} initialBucket="month" />
      </Section>

      <p style={{ fontSize: 11, color: 'var(--theme-elevation-400)', margin: 0, lineHeight: 1.6 }}>
        Tracking is anonymous by design: only daily aggregate counters are stored (no IPs, cookies or
        visitor IDs), so per-person metrics such as unique/returning visitors, session duration or
        bounce rate are not available here — Google Analytics (cookie-consented) covers those. Page
        views, devices, traffic sources, languages and searches accumulate from the day this tracker
        was deployed; country counts include all historical data.
      </p>
    </div>
  )
}

export default AnalyticsDashboard

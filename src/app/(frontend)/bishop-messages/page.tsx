import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/PageHeader'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { EmptyState } from '@/components/shared/EmptyState'
import { getLocale } from 'next-intl/server'
import { getBishopMessagesList } from '@/lib/payload/queries'

export const revalidate = 600

export const metadata: Metadata = buildMetadata({
  title: "Bishop's Messages",
  description:
    "Pastoral letters, homilies, Christmas and Easter messages from the Bishop of the Catholic Eparchy of Segeneyti.",
  path: '/bishop-messages',
})

const MESSAGE_TYPE_LABELS: Record<string, string> = {
  'pastoral-letter': 'Pastoral Letter',
  homily: 'Homily',
  'encyclical-response': 'Encyclical Response',
  christmas: 'Christmas Message',
  easter: 'Easter Message',
  extraordinary: 'Extraordinary Announcement',
  general: 'Message',
}

function formatDate(iso?: string) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default async function BishopMessagesPage() {
  const locale = await getLocale()
  const messages = await getBishopMessagesList(50, locale)

  const featured = messages.filter((m) => m.isFeatured)
  const rest = messages.filter((m) => !m.isFeatured)

  return (
    <>
      <PageHeader
        title="Bishop's Messages"
        subtitle="Pastoral letters, homilies, and official messages from the Bishop of Segeneyti."
        breadcrumbs={[{ label: "Bishop's Messages" }]}
      />

      <Section className="bg-white">
        <Container>
          {messages.length === 0 ? (
            <EmptyState
              title="No messages yet"
              description="Bishop's messages will appear here once published in the CMS."
            />
          ) : (
            <div className="space-y-10">
              {/* Featured messages */}
              {featured.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-maroon-600 mb-4">
                    Featured
                  </p>
                  <div className="grid md:grid-cols-2 gap-6">
                    {featured.map((msg) => (
                      <MessageCard key={msg.id} message={msg} featured />
                    ))}
                  </div>
                </div>
              )}

              {/* All / remaining messages */}
              {rest.length > 0 && (
                <div>
                  {featured.length > 0 && (
                    <p className="text-xs font-semibold uppercase tracking-widest text-charcoal-400 mb-4">
                      All Messages
                    </p>
                  )}
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {rest.map((msg) => (
                      <MessageCard key={msg.id} message={msg} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Container>
      </Section>
    </>
  )
}

// ─── Local card component ──────────────────────────────────────────────────────

import type { BishopMessageItem } from '@/lib/payload/queries'

function MessageCard({
  message,
  featured = false,
}: {
  message: BishopMessageItem
  featured?: boolean
}) {
  const typeLabel = message.messageType
    ? (MESSAGE_TYPE_LABELS[message.messageType] ?? message.messageType)
    : 'Message'

  return (
    <Link
      href={`/bishop-messages/${message.slug}`}
      className={`group block rounded-2xl border bg-white p-6 transition hover:shadow-md hover:border-maroon-200 ${
        featured
          ? 'border-gold-300 bg-gradient-to-br from-parchment-50 to-white shadow-sm'
          : 'border-charcoal-100'
      }`}
    >
      {/* Type badge */}
      <span className="inline-block rounded-full bg-maroon-50 border border-maroon-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-maroon-700 mb-3">
        {typeLabel}
      </span>

      <h2 className="font-serif text-lg font-semibold text-charcoal-900 group-hover:text-maroon-800 transition-colors line-clamp-2 mb-2">
        {message.title}
      </h2>

      {message.excerpt && (
        <p className="text-sm text-charcoal-500 line-clamp-3 mb-3">{message.excerpt}</p>
      )}

      <div className="flex items-center justify-between mt-auto pt-3 border-t border-charcoal-100">
        {message.publishedAt ? (
          <time
            dateTime={message.publishedAt}
            className="text-xs text-charcoal-400"
          >
            {formatDate(message.publishedAt)}
          </time>
        ) : (
          <span />
        )}
        {message.pdfUrl && (
          <span className="text-xs text-maroon-600 flex items-center gap-1">
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            PDF
          </span>
        )}
      </div>
    </Link>
  )
}

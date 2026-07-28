import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { PageHeader } from '@/components/layout/PageHeader'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import { buildMetadata } from '@/lib/seo/buildMetadata'
import { EmptyState } from '@/components/shared/EmptyState'
import { getLocale, getTranslations } from 'next-intl/server'
import {
  getPopeMessagesPage,
  getPopeSettings,
  type PopeMessageItem,
  type PopeSettingsData,
} from '@/lib/payload/queries'

// Reads the locale cookie via getLocale(), so this page can never be
// statically generated: the ISR prerender baked an empty list (the data fetch
// fails outside a request scope and the [] fallback was cached), leaving
// published messages invisible here while detail pages showed them.
export const dynamic = 'force-dynamic'

/**
 * 12 fills both breakpoints of the card grid completely (md 2-up, lg 3-up),
 * so no page ends with a ragged row except the last.
 */
const PAGE_SIZE = 12

export const metadata: Metadata = buildMetadata({
  title: 'Messages from the Holy Father',
  description:
    'Papal encyclicals, apostolic exhortations, letters, and messages from the Holy Father, shared with the faithful of the Catholic Eparchy of Segheneyti.',
  path: '/pope-messages',
})

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  encyclical: 'Encyclical',
  'apostolic-exhortation': 'Apostolic Exhortation',
  'apostolic-letter': 'Apostolic Letter',
  'apostolic-constitution': 'Apostolic Constitution',
  message: 'Message',
  homily: 'Homily',
  audience: 'Audience Address',
  other: 'Document',
}

function formatDate(iso?: string) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default async function PopeMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageParam } = await searchParams
  const currentPage = Number(pageParam) || 1
  const locale = await getLocale()
  const t = await getTranslations('popeMessages')

  const [{ docs: messages, meta }, pope] = await Promise.all([
    getPopeMessagesPage({ limit: PAGE_SIZE, page: currentPage, locale }),
    getPopeSettings(locale),
  ])

  const pageHref = (page: number) => (page > 1 ? `/pope-messages?page=${page}` : '/pope-messages')

  return (
    <>
      <PageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        breadcrumbs={[{ label: t('title') }]}
      />

      <Section className="bg-white">
        <Container>
          {pope.name && <CurrentPopeCard pope={pope} t={t} />}

          {messages.length === 0 ? (
            <EmptyState
              title="No documents yet"
              description="Papal documents and messages will appear here once published in the CMS."
            />
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {messages.map((msg) => (
                <MessageCard key={msg.id} message={msg} />
              ))}
            </div>
          )}

          {meta.totalPages > 1 && (
            <div className="mt-10 flex justify-center gap-2">
              {meta.hasPrevPage && (
                <a
                  href={pageHref(meta.page - 1)}
                  className="rounded border border-charcoal-200 px-4 py-2 text-sm text-charcoal-500 hover:border-maroon-300 hover:text-maroon-700 transition-colors"
                >
                  ← {t('previous')}
                </a>
              )}
              <span className="rounded border border-maroon-700 bg-maroon-800 px-4 py-2 text-sm text-white">
                {meta.page} / {meta.totalPages}
              </span>
              {meta.hasNextPage && (
                <a
                  href={pageHref(meta.page + 1)}
                  className="rounded border border-charcoal-200 px-4 py-2 text-sm text-charcoal-500 hover:border-maroon-300 hover:text-maroon-700 transition-colors"
                >
                  {t('next')} →
                </a>
              )}
            </div>
          )}
        </Container>
      </Section>
    </>
  )
}

// ─── Current Pope ──────────────────────────────────────────────────────────────

function CurrentPopeCard({
  pope,
  t,
}: {
  pope: PopeSettingsData
  t: (key: string, values?: Record<string, string | number | Date>) => string
}) {
  const elected = formatDate(pope.electedAt)

  return (
    <div className="mb-10 flex flex-col sm:flex-row gap-6 rounded-2xl border border-gold-200 bg-gold-50/50 p-6 sm:p-8">
      {pope.photo?.url && (
        <div className="relative h-48 w-40 shrink-0 self-center sm:self-start overflow-hidden rounded-xl border border-gold-200 bg-white">
          <Image
            src={pope.photo.url}
            alt={pope.photo.alt || pope.name || ''}
            fill
            sizes="160px"
            className="object-cover object-top"
          />
        </div>
      )}

      <div className="min-w-0 text-center sm:text-left">
        <p className="text-xs font-semibold uppercase tracking-wider text-gold-800 mb-1">
          {t('currentPopeHeading')}
        </p>
        <h2 className="font-serif text-2xl font-semibold text-charcoal-900">{pope.name}</h2>
        {pope.title && <p className="mt-1 text-sm text-maroon-700">{pope.title}</p>}
        {elected && (
          <p className="mt-1 text-xs text-charcoal-400">{t('since', { date: elected })}</p>
        )}
        {pope.bio && <p className="mt-3 text-sm leading-relaxed text-charcoal-600">{pope.bio}</p>}
        {pope.vaticanUrl && (
          <a
            href={pope.vaticanUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-sm font-medium text-maroon-700 hover:text-maroon-800 underline underline-offset-2"
          >
            {t('vaticanProfile')}
          </a>
        )}
      </div>
    </div>
  )
}

// ─── Local card component ──────────────────────────────────────────────────────

function MessageCard({ message }: { message: PopeMessageItem }) {
  const typeLabel = message.documentType
    ? (DOCUMENT_TYPE_LABELS[message.documentType] ?? message.documentType)
    : 'Document'

  return (
    <Link
      href={`/pope-messages/${message.slug}`}
      className="group flex flex-col rounded-2xl border border-charcoal-100 bg-white p-6 transition hover:shadow-md hover:border-maroon-200"
    >
      <span className="inline-block self-start rounded-full bg-gold-50 border border-gold-200 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold-800 mb-3">
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
          <time dateTime={message.publishedAt} className="text-xs text-charcoal-400">
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

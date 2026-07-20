import { RichText } from '@/components/shared/RichText'
import type { PublicQAItem } from '@/lib/payload/queries'

/**
 * Answered questions the chancery has chosen to publish.
 *
 * Read-only by design: visitors cannot reply to each other, and no submitter is
 * ever named. Everything shown here has been rewritten and approved by staff —
 * see the publishing gate in the ContactSubmissions collection.
 */
export function PublicQA({
  items,
  title,
  intro,
}: {
  items: PublicQAItem[]
  title: string
  intro: string
}) {
  if (items.length === 0) return null

  return (
    <section className="mt-16 border-t border-charcoal-100 pt-12" aria-labelledby="public-qa">
      <h2
        id="public-qa"
        className="font-serif text-2xl font-bold text-charcoal-900 mb-2"
      >
        {title}
      </h2>
      <p className="text-sm text-charcoal-500 mb-8 max-w-2xl">{intro}</p>

      <dl className="space-y-6">
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-xl border border-charcoal-100 bg-parchment-50 p-5"
          >
            <dt className="mb-3">
              {item.subject && (
                <span className="inline-block rounded-full bg-maroon-50 border border-maroon-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-maroon-700 mb-2">
                  {item.subject}
                </span>
              )}
              <p className="font-serif text-lg font-semibold text-charcoal-900 leading-snug">
                {item.question}
              </p>
            </dt>
            <dd className="border-l-2 border-gold-400 pl-4 text-charcoal-700">
              <RichText data={item.answer} />
              {item.publishedAt && (
                <time
                  dateTime={item.publishedAt}
                  className="mt-3 block text-xs text-charcoal-400"
                >
                  {new Date(item.publishedAt).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </time>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

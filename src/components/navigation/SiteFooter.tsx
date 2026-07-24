import Link from 'next/link'
import Image from 'next/image'
import { getTranslations, getLocale } from 'next-intl/server'
import { getFooterGlobal, getSiteSettings } from '@/lib/payload/queries'
import type { FooterGlobal } from '@/lib/payload/queries'
import { NewsletterForm } from '@/features/newsletter/NewsletterForm'

/** Localized fallback footer columns, used when the Footer global defines none.
 *  Labels come from the `nav` namespace so they match the header and translate. */
function defaultFooterColumns(
  tn: (key: string) => string,
): NonNullable<FooterGlobal['columns']> {
  return [
    {
      heading: tn('about'),
      links: [
        { label: tn('aboutEparchy'), url: '/about' },
        { label: tn('bishop'), url: '/about#bishop' },
        { label: tn('history'), url: '/about#history' },
        { label: tn('contact'), url: '/contact' },
      ],
    },
    {
      heading: tn('ministries'),
      links: [
        { label: tn('youthCouncil'), url: '/offices/youth-council' },
        { label: tn('catechists'), url: '/ministries#catechists' },
        { label: tn('childrenMinistry'), url: '/ministries#children' },
        { label: tn('smallChristianCommunity'), url: '/ministries#small-christian-community' },
        { label: tn('allMinistries'), url: '/ministries' },
      ],
    },
    {
      heading: tn('resources'),
      links: [
        { label: tn('bishopMessages'), url: '/bishop-messages' },
        { label: tn('popeMessages'), url: '/pope-messages' },
        { label: tn('geezCalendar'), url: '/geez-calendar' },
        { label: tn('magazines'), url: '/publications#magazines' },
        { label: tn('archives'), url: '/publications#archives' },
        { label: tn('publications'), url: '/publications' },
      ],
    },
    {
      heading: tn('media'),
      links: [
        { label: tn('gallery'), url: '/media' },
        { label: tn('news'), url: '/news' },
        { label: tn('events'), url: '/events' },
        { label: tn('parishes'), url: '/parishes' },
      ],
    },
  ]
}

type SocialKey = 'facebook' | 'youtube' | 'instagram' | 'twitter'

const SOCIAL_ICONS: Record<SocialKey, { label: string; letter: string }> = {
  facebook: { label: 'Facebook', letter: 'f' },
  youtube: { label: 'YouTube', letter: 'Y' },
  instagram: { label: 'Instagram', letter: 'IG' },
  twitter: { label: 'Twitter/X', letter: 'X' },
}

export async function SiteFooter() {
  const [footer, settings, locale] = await Promise.all([
    getFooterGlobal(),
    getSiteSettings(),
    getLocale(),
  ])
  // The footer sits on a dark maroon panel, so prefer the light-on-dark variant
  // when one is uploaded and fall back to the main logo.
  const logoUrl = settings.logoDark?.url ?? settings.logo?.url
  const siteName = settings.siteName ?? 'Eparchy of Segeneyti'
  const year = new Date().getFullYear()
  const [t, tn] = await Promise.all([getTranslations('footer'), getTranslations('nav')])

  const columns = footer.columns?.length ? footer.columns : defaultFooterColumns(tn)

  return (
    <footer className="bg-maroon-950 text-charcoal-200">
      {/* Gold top accent line */}
      <div className="h-1 bg-gradient-to-r from-gold-600 via-gold-400 to-gold-600" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand column */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt={siteName}
                  width={160}
                  height={40}
                  className="h-10 w-auto object-contain"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-maroon-800 border border-maroon-700">
                  <span className="text-gold-400 text-sm">✝</span>
                </div>
              )}
              <div>
                <p className="text-sm font-bold text-white font-serif leading-tight">
                  {siteName}
                </p>
                <p className="text-xs text-charcoal-400 leading-tight">Eritrea</p>
              </div>
            </div>
            <p className="text-xs text-charcoal-400 leading-relaxed mb-4">
              {t('tagline')}
            </p>
            {/* Social links */}
            {footer.showSocialLinks !== false && (
              <div className="flex gap-2 flex-wrap">
                {footer.socialLinks ? (
                  (Object.entries(footer.socialLinks) as [SocialKey, string][])
                    .filter(([, href]) => href)
                    .map(([key, href]) => (
                      <a
                        key={key}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-maroon-900 text-charcoal-400 hover:text-gold-400 hover:bg-maroon-800 transition-colors text-xs font-medium"
                        aria-label={SOCIAL_ICONS[key]?.label ?? key}
                      >
                        {SOCIAL_ICONS[key]?.letter ?? key[0].toUpperCase()}
                      </a>
                    ))
                ) : (
                  ['Facebook', 'YouTube', 'Telegram'].map((soc) => (
                    <a
                      key={soc}
                      href="#"
                      className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-maroon-900 text-charcoal-400 hover:text-gold-400 hover:bg-maroon-800 transition-colors text-xs font-medium"
                      aria-label={soc}
                    >
                      {soc[0]}
                    </a>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.heading}>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-gold-400 mb-4">
                {col.heading}
              </h3>
              <ul className="space-y-2">
                {col.links.map((link) => (
                  <li key={link.url}>
                    <Link
                      href={link.url}
                      {...(link.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      className="text-sm text-charcoal-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Newsletter signup — enabled from the Footer global */}
          {footer.newsletterSignup?.enabled !== false && (
            <div className="sm:col-span-2 lg:col-span-1">
              <NewsletterForm
                heading={footer.newsletterSignup?.heading ?? 'Stay updated'}
                placeholder={footer.newsletterSignup?.placeholder}
                locale={locale}
              />
            </div>
          )}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-maroon-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-charcoal-500">
          <p>{footer.copyrightText ?? `© ${year} Catholic Eparchy of Segeneyti. All rights reserved.`}</p>
          <div className="flex gap-4">
            <Link href="/contact" className="hover:text-charcoal-300 transition-colors">
              {tn('contact')}
            </Link>
            <span aria-hidden="true">·</span>
            <Link href="/search" className="hover:text-charcoal-300 transition-colors">
              {tn('search')}
            </Link>
            <span aria-hidden="true">·</span>
            <Link href="/privacy" className="hover:text-charcoal-300 transition-colors">
              {t('privacyPolicy')}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

import Link from 'next/link'
import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import type { HomepageGlobal, CMSImage } from '@/lib/payload/queries'

interface Props {
  hero?: HomepageGlobal['hero']
  /** Round site emblem shown top-right (Site Settings → Show logo on homepage banner). */
  logo?: CMSImage | null
}

/** Brand tints selectable in the CMS. */
const OVERLAY_COLORS: Record<string, string> = {
  maroon: '#5d1827',
  charcoal: '#231a18',
  green: '#1f3d2b',
  navy: '#16243f',
  gold: '#7a5b16',
}

export async function HeroSection({ hero, logo }: Props) {
  const t = await getTranslations('home')
  const heading = hero?.headline ?? "Serving God's People"
  const subheading = hero?.subheading
  const ctaPrimary = hero?.primaryCta ?? { label: 'Learn About the Eparchy', url: '/about' }
  const ctaSecondary = hero?.secondaryCta ?? { label: 'Find a Parish', url: '/parishes' }
  const bg = hero?.backgroundImage

  // Overlay is editor-controlled: colour + opacity, with an optional bottom
  // gradient so headings stay legible over busy photographs.
  const overlayKey = hero?.overlay?.color ?? 'maroon'
  const overlayColor =
    overlayKey === 'custom'
      ? hero?.overlay?.customColor || OVERLAY_COLORS.maroon
      : OVERLAY_COLORS[overlayKey]
  const overlayOpacity =
    overlayKey === 'none' ? 0 : Math.min(Math.max(hero?.overlay?.opacity ?? 65, 0), 100) / 100
  const darkenBottom = hero?.overlay?.darkenBottom ?? true

  return (
    <section
      className="relative bg-maroon-900 text-white overflow-hidden"
      aria-label="Welcome banner"
    >
      {/* Background image (CMS) or pattern fallback */}
      {bg?.url ? (
        <>
          <Image
            src={bg.url}
            alt={bg.alt}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          {/* Colour tint */}
          {overlayOpacity > 0 && overlayColor && (
            <div
              className="absolute inset-0 pointer-events-none"
              aria-hidden="true"
              style={{ backgroundColor: overlayColor, opacity: overlayOpacity }}
            />
          )}
          {/* Legibility gradient */}
          {darkenBottom && (
            <div
              className="absolute inset-0 pointer-events-none"
              aria-hidden="true"
              style={{
                background:
                  'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 45%, rgba(0,0,0,0) 75%)',
              }}
            />
          )}
        </>
      ) : (
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          aria-hidden="true"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M26 0h8v26H60v8H34v26h-8V34H0v-8h26z'/%3E%3C/g%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px',
          }}
        />
      )}

      {/* Gold top accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gold-600 via-gold-400 to-gold-600" />

      {/* Round site emblem, top-right. Hidden on small screens (phones) where
          it would crowd the headline; shown from md up, sized/offset per
          breakpoint so it sits in the open sky area of the banner. */}
      {logo?.url && (
        <div className="pointer-events-none absolute z-10 hidden md:block md:right-10 md:top-10 lg:right-16 lg:top-14 xl:right-24">
          <div className="md:h-44 md:w-44 lg:h-56 lg:w-56 xl:h-64 xl:w-64 rounded-full bg-white/95 p-2.5 shadow-2xl ring-2 ring-gold-400/80">
            <Image
              src={logo.url}
              alt={logo.alt || 'Eparchy of Segeneyti emblem'}
              width={256}
              height={256}
              className="h-full w-full rounded-full object-contain"
              sizes="(max-width: 1024px) 176px, (max-width: 1280px) 224px, 256px"
            />
          </div>
        </div>
      )}

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 md:py-32 lg:py-40">
        <div className="max-w-3xl">
          {/* Eyebrow */}
          <p className="text-gold-400 text-sm font-semibold uppercase tracking-widest mb-4">
            {t('heroEyebrow')}
          </p>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold leading-tight text-white mb-6">
            {heading}
            {subheading && (
              <span className="block text-gold-300">{subheading}</span>
            )}
          </h1>

          <p className="text-lg md:text-xl text-maroon-200 leading-relaxed mb-8 max-w-2xl">
            {t('heroWelcome')}
          </p>

          <div className="flex flex-wrap gap-4">
            {ctaPrimary?.url && (
              <Link href={ctaPrimary.url} className="btn-gold">
                {ctaPrimary.label ?? 'Learn More'}
              </Link>
            )}
            {ctaSecondary?.url && (
              <Link href={ctaSecondary.url} className="btn-secondary border-white text-white hover:bg-white/10 hover:text-white">
                {ctaSecondary.label ?? 'Find a Parish'}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-parchment/10 to-transparent pointer-events-none" />
    </section>
  )
}

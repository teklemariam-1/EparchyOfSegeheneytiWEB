import Link from 'next/link'
import Image from 'next/image'
import type { HomepageGlobal } from '@/lib/payload/queries'

interface Props {
  hero?: HomepageGlobal['hero']
}

export function HeroSection({ hero }: Props) {
  const heading = hero?.heading ?? "Serving God's People"
  const subheading = hero?.subheading ?? 'in Faith & Community'
  const ctaPrimary = hero?.ctaPrimary ?? { label: 'Learn About the Eparchy', url: '/about' }
  const ctaSecondary = hero?.ctaSecondary ?? { label: 'Find a Parish', url: '/parishes' }
  const bg = hero?.backgroundImage

  return (
    <section
      className="relative bg-maroon-900 text-white overflow-hidden"
      aria-label="Welcome banner"
    >
      {/* Background image (CMS) or pattern fallback */}
      {bg?.url ? (
        <Image
          src={bg.url}
          alt={bg.alt}
          fill
          className="object-cover opacity-30"
          priority
          sizes="100vw"
        />
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

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 md:py-32 lg:py-40">
        <div className="max-w-3xl">
          {/* Eyebrow */}
          <p className="text-gold-400 text-sm font-semibold uppercase tracking-widest mb-4">
            Catholic Eparchy of Segeneyti · ካቶሊካዊ ጵጵስና ሰገነይቲ
          </p>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold leading-tight text-white mb-6">
            {heading}
            {subheading && (
              <span className="block text-gold-300">{subheading}</span>
            )}
          </h1>

          <p className="text-lg md:text-xl text-maroon-200 leading-relaxed mb-8 max-w-2xl">
            Welcome to the official website of the Catholic Eparchy of Segeneyti, Eritrea.
            Rooted in faith, united in mission, and open to all.
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

import Image from 'next/image'
import Link from 'next/link'
import { Section } from '@/components/layout/Section'
import { Container } from '@/components/layout/Container'
import type { HomepageGlobal, BishopMessageItem } from '@/lib/payload/queries'

interface Props {
  config?: HomepageGlobal['bishopMessage']
  message?: BishopMessageItem | null
}

export function BishopMessageSection({ config, message }: Props) {
  if (config?.enabled === false) return null

  const bishopName = config?.bishopName ?? 'Most Rev. [Bishop Name]'
  const bishopTitle = config?.bishopTitle ?? 'Bishop of Segeneyti'
  const photo = config?.photo
  const excerpt =
    config?.messageExcerpt ??
    message?.excerpt ??
    'Dear brothers and sisters in Christ, let us continue to walk together in faith, serving one another with love, and building the Kingdom of God in our communities and families throughout the Eparchy.'
  const linkUrl = config?.linkUrl ?? (message?.slug ? `/bishop-messages/${message.slug}` : '/bishop-messages')
  const linkLabel = config?.linkLabel ?? 'Read Full Message'

  return (
    <Section className="bg-maroon-950 text-white" aria-labelledby="bishop-message-title">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-16 items-center">
          {/* Bishop photo */}
          <div className="flex justify-center lg:justify-start">
            <div className="relative">
              {photo?.url ? (
                <Image
                  src={photo.url}
                  alt={photo.alt || bishopName}
                  width={224}
                  height={224}
                  className="w-48 h-48 lg:w-56 lg:h-56 rounded-full object-cover border-4 border-gold-500 shadow-2xl"
                />
              ) : (
                <div className="w-48 h-48 lg:w-56 lg:h-56 rounded-full bg-gradient-to-br from-maroon-800 to-maroon-900 border-4 border-gold-500 flex items-center justify-center shadow-2xl">
                  <span className="text-gold-400 text-5xl">✝</span>
                </div>
              )}
              {/* Gold ring accent */}
              <div className="absolute -inset-2 rounded-full border border-gold-600/30" />
            </div>
          </div>

          {/* Text */}
          <div className="lg:col-span-2">
            <p className="text-gold-400 text-sm font-semibold uppercase tracking-widest mb-2">
              Message from the Bishop
            </p>

            <h2
              id="bishop-message-title"
              className="text-2xl md:text-3xl lg:text-4xl font-serif font-bold text-white mb-1"
            >
              His Excellency,<br />
              <span className="text-gold-300">{bishopName}</span>
            </h2>

            <p className="text-sm text-maroon-300 mb-6">{bishopTitle}</p>

            <blockquote className="border-l-4 border-gold-500 pl-6 mb-8">
              <p className="text-lg text-maroon-100 leading-relaxed italic">
                &ldquo;{excerpt}&rdquo;
              </p>
            </blockquote>

            <Link href={linkUrl} className="btn-gold">
              {linkLabel}
            </Link>
          </div>
        </div>
      </Container>
    </Section>
  )
}

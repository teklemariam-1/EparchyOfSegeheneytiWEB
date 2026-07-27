import Link from 'next/link'
import { Container } from '@/components/layout/Container'
import type { HomepageGlobal, BishopMessageItem } from '@/lib/payload/queries'
import type { BishopRecord } from '@/lib/bishops/queries'

interface Props {
  config?: HomepageGlobal['bishopMessage']
  message?: BishopMessageItem | null
  /** The sitting Eparch. Supplies name, title and portrait; null before one is set. */
  bishop?: BishopRecord | null
}

/** Palette of the "sacred dawn" composition (see design SVG). */
const C = {
  bg: '#330C10',
  archFill: '#26080B',
  ground: '#3E1015',
  haloDisc: '#43131A',
  ivory: '#F7EFE6',
  gold: '#F5A623',
  goldSoft: '#F5C963',
  cream: '#FDF8F0',
  rose: '#E8A7A0',
  quote: '#F0E4D8',
}

/**
 * Arched sacred-window portrait: dawn rays above the arch, cross-weave and
 * halo rings inside it, and the bishop's photo in an ivory, gold-ringed
 * circle. Pure SVG so every element scales together at any width.
 */
function ArchPortrait({ photoUrl, alt }: { photoUrl?: string; alt: string }) {
  return (
    <svg
      viewBox="0 0 310 302"
      role="img"
      aria-label={alt}
      // Small/medium screens: fixed sizes (single stacked column). Large screens
      // (two-column layout): fill the column so the arch stays proportional to the
      // text beside it, capped by max-width so it never overflows the narrow end
      // of the lg range or grows unbounded on very wide desktops.
      className="w-64 sm:w-72 lg:w-full lg:max-w-sm xl:max-w-md h-auto"
    >
      <defs>
        <pattern id="bishop-weave" width="44" height="44" patternUnits="userSpaceOnUse">
          <path d="M22 8 L22 36 M8 22 L36 22" stroke={C.gold} strokeWidth="1" opacity="0.09" fill="none" />
          <circle cx="22" cy="22" r="3.5" stroke={C.gold} strokeWidth="0.75" opacity="0.09" fill="none" />
        </pattern>
        <clipPath id="bishop-arch">
          <path d="M55 300 L55 145 Q55 45 155 45 Q255 45 255 145 L255 300 Z" />
        </clipPath>
        <clipPath id="bishop-portrait">
          <circle cx="155" cy="158" r="64" />
        </clipPath>
      </defs>

      {/* Dawn rays */}
      <polygon points="155,45 30,0 90,0" fill={C.gold} opacity="0.05" />
      <polygon points="155,45 130,0 190,0" fill={C.gold} opacity="0.07" />
      <polygon points="155,45 230,0 290,0" fill={C.gold} opacity="0.05" />

      {/* Outer arch outline */}
      <path
        d="M40 300 L40 145 Q40 30 155 30 Q270 30 270 145 L270 300"
        fill="none"
        stroke={C.gold}
        strokeWidth="1.5"
        opacity="0.5"
      />

      {/* Inner arch: fill, cross-weave, halo rings */}
      <path d="M55 300 L55 145 Q55 45 155 45 Q255 45 255 145 L255 300 Z" fill={C.archFill} />
      <rect x="55" y="45" width="200" height="255" fill="url(#bishop-weave)" clipPath="url(#bishop-arch)" />
      <circle cx="155" cy="158" r="95" fill="none" stroke={C.gold} strokeWidth="0.75" opacity="0.3" clipPath="url(#bishop-arch)" />
      <circle cx="155" cy="158" r="118" fill="none" stroke={C.gold} strokeWidth="0.75" opacity="0.18" clipPath="url(#bishop-arch)" />

      {/* Portrait disc */}
      <circle cx="155" cy="158" r="80" fill={C.haloDisc} />
      <circle cx="155" cy="158" r="64" fill={C.ivory} />
      {photoUrl ? (
        <image
          href={photoUrl}
          x="91"
          y="94"
          width="128"
          height="128"
          preserveAspectRatio="xMidYMid slice"
          clipPath="url(#bishop-portrait)"
        />
      ) : (
        <text
          x="155"
          y="176"
          textAnchor="middle"
          fontSize="52"
          fill={C.gold}
        >
          ✝
        </text>
      )}
      <circle cx="155" cy="158" r="64" fill="none" stroke={C.gold} strokeWidth="4" />
      <circle cx="155" cy="158" r="72" fill="none" stroke={C.gold} strokeWidth="0.75" opacity="0.45" />
    </svg>
  )
}

/** Scattered gold stars in the open sky, top-right of the section. */
function Stars() {
  const stars: Array<[number, number, number, number]> = [
    [560, 42, 2.5, 0.55],
    [620, 80, 1.5, 0.4],
    [510, 24, 1.5, 0.35],
    [648, 35, 1.75, 0.45],
    [590, 132, 1.25, 0.3],
    [655, 185, 2, 0.35],
    [330, 30, 1.5, 0.3],
  ]
  return (
    <svg
      viewBox="300 0 380 220"
      aria-hidden="true"
      className="pointer-events-none absolute right-0 top-0 h-40 sm:h-56 w-auto"
    >
      {stars.map(([x, y, r, o]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill={C.gold} opacity={o} />
      ))}
    </svg>
  )
}

export function BishopMessageSection({ config, message, bishop }: Props) {
  if (config?.enabled === false) return null

  // Identity comes from the sitting bishop record. The homepage global's own
  // bishopName/bishopTitle/photo remain only as a fallback for a site that has
  // not created a bishop record yet, and this section renders nothing at all
  // rather than showing the literal "Most Rev. [Bishop Name]" placeholder that
  // used to ship to production when both were empty.
  const bishopName = bishop?.fullName ?? config?.bishopName
  const bishopTitle = bishop?.formalTitle ?? config?.bishopTitle
  const photo = bishop?.portrait ?? config?.photo
  if (!bishopName) return null
  // No invented fallback. This renders inside quotation marks attributed to the
  // Eparch by name, so a stock paragraph here would publish words he never
  // wrote — the quote block is simply omitted when there is nothing real.
  const excerpt = config?.messageExcerpt ?? message?.excerpt ?? null
  const linkUrl = config?.linkUrl ?? (message?.slug ? `/bishop-messages/${message.slug}` : '/bishop-messages')
  const linkLabel = config?.linkLabel ?? 'Read Full Message'

  return (
    <section
      aria-labelledby="bishop-message-title"
      className="relative overflow-hidden"
      style={{ backgroundColor: C.bg }}
    >
      <Stars />

      <Container>
        <div className="relative grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-14 items-end pt-14 sm:pt-16 pb-20 sm:pb-24">
          {/* Arched portrait — bottom-aligned so the arch "stands" on the ground curve */}
          <div className="lg:col-span-2 flex justify-center lg:justify-start -mb-8 sm:-mb-10 lg:-mb-12">
            <ArchPortrait photoUrl={photo?.url} alt={photo?.alt || bishopName} />
          </div>

          {/* Text column */}
          <div className="lg:col-span-3 pb-6 text-center lg:text-left">
            <p
              className="text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] mb-4"
              style={{ color: C.gold }}
            >
              Message from the Bishop
            </p>

            <h2 id="bishop-message-title" className="font-serif mb-2">
              <span className="block text-2xl sm:text-3xl font-medium" style={{ color: C.cream }}>
                His Excellency,
              </span>
              <span
                className="block text-xl sm:text-2xl lg:text-3xl font-medium mt-1"
                style={{ color: C.goldSoft }}
              >
                {bishopName}
              </span>
            </h2>

            {bishopTitle ? (
              <p className="text-sm mb-7" style={{ color: C.rose }}>
                {bishopTitle}
              </p>
            ) : null}

            {excerpt ? (
              <blockquote
                className="mb-8 pl-4 text-left mx-auto lg:mx-0 max-w-xl"
                style={{ borderLeft: `3px solid ${C.gold}` }}
              >
                <p className="italic leading-relaxed text-sm sm:text-base" style={{ color: C.quote }}>
                  &ldquo;{excerpt}&rdquo;
                </p>
              </blockquote>
            ) : null}

            <Link
              href={linkUrl}
              className="inline-flex items-center rounded-lg px-5 py-2.5 text-sm font-medium shadow-md transition-transform hover:scale-[1.03]"
              style={{ backgroundColor: C.gold, color: C.bg }}
            >
              {linkLabel}
            </Link>
          </div>
        </div>
      </Container>

      {/* Ground curve */}
      <svg
        viewBox="0 0 680 48"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 w-full h-8 sm:h-12"
      >
        <path d="M0 40 Q340 2 680 40 L680 48 L0 48 Z" fill={C.ground} />
        <path d="M0 32 Q340 -6 680 32" fill="none" stroke={C.gold} strokeWidth="0.75" opacity="0.3" />
      </svg>
    </section>
  )
}

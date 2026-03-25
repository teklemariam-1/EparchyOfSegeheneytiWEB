import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-parchment-50 flex flex-col items-center justify-center px-4 text-center">
      {/* Cross icon */}
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-maroon-50 border-2 border-maroon-100">
        <span className="text-4xl text-maroon-700 font-serif leading-none select-none" aria-hidden="true">✝</span>
      </div>

      {/* Divider */}
      <div className="mb-6 h-px w-16 bg-gold-400" aria-hidden="true" />

      <p className="text-xs font-semibold uppercase tracking-widest text-maroon-500 mb-3">404</p>

      <h1 className="font-serif text-3xl sm:text-4xl font-bold text-charcoal-900 mb-3">
        Page Not Found
      </h1>

      <p className="text-charcoal-500 text-base max-w-sm mb-8 leading-relaxed">
        The page you are looking for does not exist or may have been moved. Return
        to the home page to continue exploring the Eparchy.
      </p>

      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-lg bg-maroon-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-maroon-700 transition-colors"
        >
          Return Home
        </Link>
        <Link
          href="/contact"
          className="rounded-lg border border-charcoal-200 px-5 py-2.5 text-sm font-medium text-charcoal-700 hover:border-maroon-300 hover:text-maroon-800 transition-colors"
        >
          Contact Us
        </Link>
      </div>

      {/* Quick nav */}
      <nav className="mt-12" aria-label="Helpful links">
        <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-400 mb-4">
          You might be looking for
        </p>
        <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2">
          {[
            { label: 'News', href: '/news' },
            { label: 'Events', href: '/events' },
            { label: 'Parishes', href: '/parishes' },
            { label: "Bishop's Messages", href: '/bishop-messages' },
            { label: 'Publications', href: '/publications' },
            { label: 'Media', href: '/media' },
          ].map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-sm text-maroon-700 hover:text-maroon-900 hover:underline transition-colors"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}

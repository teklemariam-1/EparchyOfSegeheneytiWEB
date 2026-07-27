const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').trim()
const SITE_NAME = 'Catholic Eparchy of Segeneyti'
const SITE_LOGO = `${SITE_URL}/images/logo.png`

/** JSON-LD for the WebSite root */
export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: 'Official website of the Catholic Eparchy of Segeneyti, Eritrea.',
    inLanguage: ['en', 'ti'],
  }
}

/** JSON-LD for the Organization (Eparchy) */
export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ReligiousOrganization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: SITE_LOGO,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Segeneyti',
      addressCountry: 'ER',
    },
  }
}

/** JSON-LD for a News article */
export function articleSchema({
  title,
  description,
  imageUrl,
  publishedAt,
  updatedAt,
  slug,
}: {
  title: string
  description?: string
  imageUrl?: string
  publishedAt: string
  updatedAt?: string
  slug: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: title,
    description,
    image: imageUrl ? [imageUrl] : undefined,
    datePublished: publishedAt,
    dateModified: updatedAt ?? publishedAt,
    url: `${SITE_URL}/news/${slug}`,
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: { '@type': 'ImageObject', url: SITE_LOGO },
    },
  }
}

/** JSON-LD for an Event */
export function eventSchema({
  title,
  description,
  startDate,
  endDate,
  location,
  imageUrl,
  slug,
}: {
  title: string
  description?: string
  startDate: string
  endDate?: string
  location?: string
  imageUrl?: string
  slug: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: title,
    description,
    startDate,
    endDate,
    location: location
      ? { '@type': 'Place', name: location }
      : undefined,
    image: imageUrl ? [imageUrl] : undefined,
    url: `${SITE_URL}/events/${slug}`,
    organizer: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
  }
}

/**
 * JSON-LD for a Person — priests, and the Eparchs.
 *
 * `url` is optional so the original priest callers keep their anchor into the
 * clergy listing, while a bishop passes his own profile path. `sameAs` carries
 * the public reference links, which is what lets a search engine reconcile this
 * page with the Holy See's own record of the same man; omitting it leaves two
 * unconnected entities.
 *
 * Undefined keys are dropped before serialising: an `honorificPrefix: undefined`
 * survives JSON.stringify as an absent key, but an explicit `null` would be
 * emitted and read as an assertion that he has none.
 */
export function personSchema({
  name,
  jobTitle,
  imageUrl,
  slug,
  url,
  honorificPrefix,
  description,
  birthDate,
  deathDate,
  sameAs,
}: {
  name: string
  jobTitle?: string
  imageUrl?: string
  slug: string
  url?: string
  honorificPrefix?: string
  description?: string
  birthDate?: string
  deathDate?: string
  sameAs?: string[]
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    honorificPrefix,
    jobTitle,
    description,
    birthDate,
    deathDate,
    image: imageUrl,
    url: url ? `${SITE_URL}${url}` : `${SITE_URL}/ministries/priests-and-ministries#${slug}`,
    sameAs: sameAs?.length ? sameAs : undefined,
    affiliation: {
      '@type': 'ReligiousOrganization',
      name: SITE_NAME,
    },
    worksFor: {
      '@type': 'ReligiousOrganization',
      name: SITE_NAME,
      url: SITE_URL,
    },
  }
}

import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { en } from '@payloadcms/translations/languages/en'
import sharp from 'sharp'
import path from 'path'
import { fileURLToPath } from 'url'

// ── Collections ──────────────────────────────────────────────────────────────
// NOTE: relative imports required here — Payload CLI runs this file with
// its own tsx/Node.js ESM loader which does NOT resolve @/ path aliases.
// Explicit /index suffix required — ESM does not support bare directory imports.
import { Users } from './collections/Users/index'
import { Media } from './collections/Media/index'
import { Pages } from './collections/Pages/index'
import { News } from './collections/News/index'
import { NewsCategories } from './collections/NewsCategories/index'
import { Events } from './collections/Events/index'
import { EventTypes } from './collections/EventTypes/index'
import { Parishes } from './collections/Parishes/index'
import { Ministries } from './collections/Ministries/index'
import { Priests } from './collections/Priests/index'
import { Vicariates } from './collections/Vicariates/index'
import { Offices } from './collections/Offices/index'
import { FeedSources } from './collections/FeedSources/index'
import { Subscribers } from './collections/Subscribers/index'
import { VisitorStats } from './collections/VisitorStats/index'
import { PopeMessages } from './collections/PopeMessages/index'
import { BishopMessages } from './collections/BishopMessages/index'
import { Bishops } from './collections/Bishops/index'
import { Publications } from './collections/Publications/index'
import { Magazines } from './collections/Magazines/index'
import { Archives } from './collections/Archives/index'
import { Apps } from './collections/Apps/index'
import { Schools } from './collections/Schools/index'
import { Clinics } from './collections/Clinics/index'
import { ChildrenPrograms } from './collections/ChildrenPrograms/index'
import { SmallChristianCommunities } from './collections/SmallChristianCommunities/index'
import { GeezCalendarEntries } from './collections/GeezCalendarEntries/index'
import { GeezCalendarDays } from './collections/GeezCalendarDays/index'
import { GeezMonthlyFeasts } from './collections/GeezMonthlyFeasts/index'
import { ContactSubmissions } from './collections/ContactSubmissions/index'
import { Donations } from './collections/Donations/index'
import { StripeEvents } from './collections/StripeEvents/index'
import { AuditLog } from './collections/AuditLog/index'
import { RateLimits } from './collections/RateLimits/index'

// ── Globals ───────────────────────────────────────────────────────────────────
import { SiteSettings } from './globals/SiteSettings/index'
import { DonationSettings } from './globals/DonationSettings/index'
import { Header } from './globals/Header/index'
import { Footer } from './globals/Footer/index'
import { Homepage } from './globals/Homepage/index'
import { Navigation } from './globals/Navigation/index'
import { AboutPage } from './globals/AboutPage/index'
import { BannerSettings } from './globals/BannerSettings/index'
import { PopeSettings } from './globals/PopeSettings/index'
import { buildEmailAdapter, validateEmailConfig } from './lib/payload/email'
import { env } from './lib/env'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const storageAdapter = process.env.STORAGE_ADAPTER
const isS3 = storageAdapter === 's3'
const isVercelBlob = storageAdapter === 'vercel-blob' && Boolean(process.env.BLOB_READ_WRITE_TOKEN)

/**
 * Whether a connection string points at a database on this machine.
 *
 * Used to gate Drizzle's schema push, which rewrites the schema of whatever it
 * is pointed at. Deliberately a strict allow-list of loopback hosts: anything
 * unparseable, unset, or remote returns false, so the failure mode is "push is
 * off" rather than "push runs against a host we did not expect".
 */
function isLocalDatabase(connectionString: string | undefined): boolean {
  if (!connectionString) return false
  let host: string
  try {
    host = new URL(connectionString).hostname.toLowerCase()
  } catch {
    return false
  }
  // `host.docker.internal` is included because the dev database is sometimes
  // reached from inside a container; it still resolves to this machine.
  return ['localhost', '127.0.0.1', '::1', '[::1]', 'host.docker.internal'].includes(host)
}

if (process.env.NODE_ENV !== 'production' && !isLocalDatabase(env.DATABASE_URI)) {
  // Loud, because the alternative is a developer wondering for an hour why
  // their schema changes are not appearing.
  console.warn(
    '[payload-db] ⚠ Schema push is DISABLED: DATABASE_URI is not a local database.\n' +
      '            This guards the production database against dev-mode schema writes.\n' +
      '            Point DATABASE_URI at localhost for local development, or run\n' +
      '            `npm run migrate:create` and apply a migration instead.',
  )
}

// Validate email config at startup
const emailConfig = validateEmailConfig()
if (emailConfig.warnings.length > 0) {
  for (const w of emailConfig.warnings) {
    console.warn(`[payload-email] ⚠ ${w}`)
  }
}

export default buildConfig({
  // ── Admin UI ────────────────────────────────────────────────────────────────
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: ' | Eparchy of Segheneyti Admin',
      icons: [{ rel: 'icon', url: '/favicon.ico' }],
      openGraph: {
        images: [{ url: '/images/og-admin.png' }],
      },
    },
    components: {
      // Custom branding in the admin panel
      graphics: {
        Logo: {
          path: '@/components/admin/AdminLogo',
        },
        Icon: {
          path: '@/components/admin/AdminIcon',
        },
      },
      // Dashboard shortcut + unread contact-message badge above the nav links.
      beforeNavLinks: [
        '@/components/admin/DashboardNavLink#DashboardNavLink',
        '@/components/admin/ContactInboxBadge#ContactInboxBadge',
      ],
      // Ge'ez New-Year import wizard, below the collection nav.
      afterNavLinks: [
        '@/components/admin/calendar/CalendarImportNavLink#CalendarImportNavLink',
      ],
      // Stats-focused dashboard: replaces the default view, whose per-collection
      // cards (with quick-create "+" buttons) duplicated the sidebar nav.
      views: {
        dashboard: {
          Component: '@/components/admin/AdminDashboard',
        },
        calendarImport: {
          Component: '@/components/admin/calendar/CalendarImportView',
          path: '/calendar-import',
        },
      },
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },

  // ── Collections ──────────────────────────────────────────────────────────────
  collections: [
    Users,
    Media,
    Pages,
    News,
    NewsCategories,
    Events,
    EventTypes,
    Vicariates,

    Offices,

    FeedSources,


    Subscribers,


    VisitorStats,
    Parishes,
    Ministries,
    Priests,
    PopeMessages,
    Bishops,
    BishopMessages,
    Publications,
    Magazines,
    Archives,
    Apps,
    Schools,
    Clinics,
    ChildrenPrograms,
    SmallChristianCommunities,
    GeezCalendarEntries,
    GeezCalendarDays,
    GeezMonthlyFeasts,
    ContactSubmissions,
    Donations,
    StripeEvents,
    AuditLog,
    RateLimits,
  ],

  // ── Globals ───────────────────────────────────────────────────────────────────
  globals: [
    SiteSettings,
    Header,
    Footer,
    Homepage,
    Navigation,
    AboutPage,
    BannerSettings,
    DonationSettings,
    PopeSettings,
  ],

  // ── Editor ───────────────────────────────────────────────────────────────────
  editor: lexicalEditor({}),

  // ── Database ──────────────────────────────────────────────────────────────────
  db: postgresAdapter({
    pool: {
      connectionString: env.DATABASE_URI,
    },
    // Disable Drizzle's dev schema-push in production. With push enabled,
    // `payload migrate` in CI hits an interactive "data loss will occur —
    // proceed? (y/N)" prompt, hangs ~8 min on the non-interactive stdin, then
    // defaults to "No" and exits 0 WITHOUT applying migrations (silent schema
    // drift). Production is migration-driven only; local dev keeps push.
    //
    // NODE_ENV alone is not enough, and this has already cost us a deploy: the
    // bishops schema reached the production database because `npm run dev` —
    // which is not "production" — was run with .env.vercel.local loaded, whose
    // DATABASE_URI points at Neon. Push happily created 17 enum types and 56
    // tables in the live database, with no migration record, and the next real
    // deploy then failed on "already exists".
    //
    // So push additionally requires the database to be a LOCAL one. The
    // dangerous combination is a development NODE_ENV pointed at a remote host,
    // and that is precisely what this refuses.
    push: process.env.NODE_ENV !== 'production' && isLocalDatabase(env.DATABASE_URI),
  }),

  // ── Localization ──────────────────────────────────────────────────────────────
  // Field-level i18n: content is stored per locale in the same DB row
  localization: {
    locales: [
      {
        code: 'en',
        label: 'English',
        rtl: false,
      },
      {
        code: 'ti',
        label: 'ትግርኛ (Tigrinya)',
        rtl: false,
      },
      // Arabic omitted for now — add when NEXT_PUBLIC_ENABLE_ARABIC=true
    ],
    defaultLocale: 'en',
    fallback: true,
  },

  // ── i18n (Admin UI labels) ────────────────────────────────────────────────────
  i18n: {
    supportedLanguages: { en },
    fallbackLanguage: 'en',
  },

  email: buildEmailAdapter,

  // ── File storage ──────────────────────────────────────────────────────────────
  // Persistent object storage is required in production — Vercel's serverless
  // filesystem is ephemeral, so STORAGE_ADAPTER=local loses uploads. Prefer
  // Vercel Blob (STORAGE_ADAPTER=vercel-blob) or S3/R2 (STORAGE_ADAPTER=s3).
  plugins: [
    ...(isVercelBlob
      ? [
          vercelBlobStorage({
            enabled: true,
            // Upload straight from the browser to Blob. Vercel serverless
            // functions cap request bodies at ~4.5 MB, so without this any
            // sizeable file (e.g. an Android APK) would fail to upload.
            clientUploads: true,
            // Serve files straight from the Blob CDN instead of proxying through
            // Payload's /api/media/file route (which 404s and costs a function
            // invocation per image).
            //
            // Vercel Blob is public-only: object URLs are reachable by anyone
            // who has them (the hash suffix makes them unguessable, not private).
            // The app never hands out the raw URL of a `restricted` asset — the
            // Media read access filter hides them from the API, and the query
            // layer strips restricted archive file URLs before render. Authorized
            // retrieval of restricted assets goes through the access-controlled
            // /api/secure-file/[id] route. Residual risk: a leaked raw Blob URL
            // stays reachable. Truly private files require R2/S3 + signed URLs.
            collections: { media: { disablePayloadAccessControl: true } },
            token: process.env.BLOB_READ_WRITE_TOKEN as string,
          }),
        ]
      : []),
    ...(isS3
      ? [
          s3Storage({
            collections: {
              media: {
                prefix: 'media',
              },
            },
            bucket: process.env.S3_BUCKET ?? '',
            config: {
              credentials: {
                accessKeyId: process.env.S3_ACCESS_KEY_ID ?? '',
                secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? '',
              },
              region: process.env.S3_REGION ?? 'auto',
              endpoint: process.env.S3_ENDPOINT,
            },
          }),
        ]
      : []),
  ],

  // ── Security ──────────────────────────────────────────────────────────────────
  secret: env.PAYLOAD_SECRET,
  csrf: [
    (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').trim(),
  ],

  // ── TypeScript type output ────────────────────────────────────────────────────
  typescript: {
    outputFile: path.resolve(dirname, 'types/payload-types.ts'),
  },

  // ── Upload defaults ───────────────────────────────────────────────────────────
  upload: {
    // Local upload dir — used when STORAGE_ADAPTER=local
    limits: {
      fileSize: 150_000_000, // 150 MB — Android APKs are far larger than images
    },
  },

  sharp,
})

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
import { Events } from './collections/Events/index'
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
import { Publications } from './collections/Publications/index'
import { Magazines } from './collections/Magazines/index'
import { Archives } from './collections/Archives/index'
import { Apps } from './collections/Apps/index'
import { Schools } from './collections/Schools/index'
import { Clinics } from './collections/Clinics/index'
import { ChildrenPrograms } from './collections/ChildrenPrograms/index'
import { SmallChristianCommunities } from './collections/SmallChristianCommunities/index'
import { GeezCalendarEntries } from './collections/GeezCalendarEntries/index'
import { ContactSubmissions } from './collections/ContactSubmissions/index'

// ── Globals ───────────────────────────────────────────────────────────────────
import { SiteSettings } from './globals/SiteSettings/index'
import { Header } from './globals/Header/index'
import { Footer } from './globals/Footer/index'
import { Homepage } from './globals/Homepage/index'
import { Navigation } from './globals/Navigation/index'
import { AboutPage } from './globals/AboutPage/index'
import { buildEmailAdapter, validateEmailConfig } from './lib/payload/email'
import { env } from './lib/env'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const storageAdapter = process.env.STORAGE_ADAPTER
const isS3 = storageAdapter === 's3'
const isVercelBlob = storageAdapter === 'vercel-blob' && Boolean(process.env.BLOB_READ_WRITE_TOKEN)

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
      titleSuffix: ' | Eparchy of Segeneyti Admin',
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
      // Unread contact-message badge above the nav links.
      beforeNavLinks: ['@/components/admin/ContactInboxBadge#ContactInboxBadge'],
      beforeDashboard: ['@/components/admin/DashboardStats'],
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
    Events,
    Vicariates,

    Offices,

    FeedSources,


    Subscribers,


    VisitorStats,
    Parishes,
    Ministries,
    Priests,
    PopeMessages,
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
    ContactSubmissions,
  ],

  // ── Globals ───────────────────────────────────────────────────────────────────
  globals: [
    SiteSettings,
    Header,
    Footer,
    Homepage,
    Navigation,
    AboutPage,
  ],

  // ── Editor ───────────────────────────────────────────────────────────────────
  editor: lexicalEditor({}),

  // ── Database ──────────────────────────────────────────────────────────────────
  db: postgresAdapter({
    pool: {
      connectionString: env.DATABASE_URI,
    },
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
            // invocation per image). The Blob store is public, so its URLs are
            // publicly reachable regardless of Payload access control.
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

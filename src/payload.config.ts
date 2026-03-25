import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
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
import { PopeMessages } from './collections/PopeMessages/index'
import { BishopMessages } from './collections/BishopMessages/index'
import { Publications } from './collections/Publications/index'
import { Magazines } from './collections/Magazines/index'
import { Archives } from './collections/Archives/index'
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

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const isS3 = process.env.STORAGE_ADAPTER === 's3'

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
    Parishes,
    Ministries,
    Priests,
    PopeMessages,
    BishopMessages,
    Publications,
    Magazines,
    Archives,
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
  ],

  // ── Editor ───────────────────────────────────────────────────────────────────
  editor: lexicalEditor({}),

  // ── Database ──────────────────────────────────────────────────────────────────
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI ?? '',
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

  // ── File storage ──────────────────────────────────────────────────────────────
  plugins: isS3
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
    : [],

  // ── Security ──────────────────────────────────────────────────────────────────
  secret: process.env.PAYLOAD_SECRET ?? '',
  csrf: [
    process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  ],

  // ── TypeScript type output ────────────────────────────────────────────────────
  typescript: {
    outputFile: path.resolve(dirname, 'types/payload-types.ts'),
  },

  // ── Upload defaults ───────────────────────────────────────────────────────────
  upload: {
    // Local upload dir — used when STORAGE_ADAPTER=local
    limits: {
      fileSize: 20_000_000, // 20 MB
    },
  },

  sharp,
})

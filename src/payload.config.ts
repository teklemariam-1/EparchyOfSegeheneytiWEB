import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import { en } from '@payloadcms/translations/languages/en'
import path from 'path'
import { fileURLToPath } from 'url'

// ── Collections ──────────────────────────────────────────────────────────────
// NOTE: relative imports required here — Payload CLI runs this file with
// its own tsx/Node.js ESM loader which does NOT resolve @/ path aliases.
import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { News } from './collections/News'
import { Events } from './collections/Events'
import { Parishes } from './collections/Parishes'
import { Ministries } from './collections/Ministries'
import { Priests } from './collections/Priests'
import { PopeMessages } from './collections/PopeMessages'
import { BishopMessages } from './collections/BishopMessages'
import { Publications } from './collections/Publications'
import { Magazines } from './collections/Magazines'
import { Archives } from './collections/Archives'
import { Schools } from './collections/Schools'
import { Clinics } from './collections/Clinics'
import { ChildrenPrograms } from './collections/ChildrenPrograms'
import { SmallChristianCommunities } from './collections/SmallChristianCommunities'
import { GeezCalendarEntries } from './collections/GeezCalendarEntries'
import { ContactSubmissions } from './collections/ContactSubmissions'

// ── Globals ───────────────────────────────────────────────────────────────────
import { SiteSettings } from './globals/SiteSettings'
import { Header } from './globals/Header'
import { Footer } from './globals/Footer'
import { Homepage } from './globals/Homepage'
import { Navigation } from './globals/Navigation'

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
})

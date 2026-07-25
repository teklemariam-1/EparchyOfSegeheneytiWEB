import type { Role } from '../constants/roles'

/**
 * The permission catalog — the single source of truth for what can be authorized.
 *
 * Every access decision in the app resolves to one of these `resource.action`
 * strings via `hasPermission` (see ./resolve). Roles are presets that map to a
 * default set of these permissions; per-user grant/revoke overrides layer on top.
 * A permission only belongs here once something enforces it — an entry nothing
 * checks reads as protection that does not exist.
 *
 * NOTE: the Users override pickers are `select` fields, so this list is mirrored
 * as a Postgres enum. Adding or removing an entry needs a migration
 * (`npm run migrate:create`) alongside the code change.
 *
 * `super-admin` is intentionally NOT enumerated in any preset — the resolver
 * grants it the entire catalog via a short-circuit, so adding a new permission
 * here automatically belongs to super-admin and nobody else until assigned.
 *
 * The default preset mapping below is calibrated to reproduce the access that
 * existed BEFORE this system, so migrating existing users changes nothing about
 * what they can do on day one.
 */
export const PERMISSIONS = [
  // ── Content (draft-enabled → distinct .publish) ──────────────────────────
  'news.create', 'news.update', 'news.delete', 'news.publish',
  'pages.create', 'pages.update', 'pages.delete', 'pages.publish',
  'pope-messages.create', 'pope-messages.update', 'pope-messages.delete', 'pope-messages.publish',
  'bishop-messages.create', 'bishop-messages.update', 'bishop-messages.delete', 'bishop-messages.publish',
  'apps.create', 'apps.update', 'apps.delete', 'apps.publish',
  'offices.create', 'offices.update', 'offices.delete', 'offices.publish',
  'events.create', 'events.update', 'events.delete', 'events.publish', 'events.manage-own',

  // ── Content (no drafts) ──────────────────────────────────────────────────
  'publications.create', 'publications.update', 'publications.delete',
  'magazines.create', 'magazines.update', 'magazines.delete',
  'archives.create', 'archives.update', 'archives.delete',
  'priests.create', 'priests.update', 'priests.delete',
  'vicariates.create', 'vicariates.update', 'vicariates.delete',
  'schools.create', 'schools.update', 'schools.delete',
  'clinics.create', 'clinics.update', 'clinics.delete',
  'parishes.create', 'parishes.update', 'parishes.delete', 'parishes.update-own',
  'ministries.create', 'ministries.update', 'ministries.delete',
  'children-programs.create', 'children-programs.update', 'children-programs.delete',
  'small-christian-communities.create', 'small-christian-communities.update',
  'small-christian-communities.delete', 'small-christian-communities.manage-own',

  // ── Taxonomies & calendar ────────────────────────────────────────────────
  'news-categories.manage',
  'event-types.manage',
  'geez-calendar.manage',
  'geez-calendar.import',

  // ── Media ────────────────────────────────────────────────────────────────
  'media.upload', 'media.delete', 'media.view-restricted',

  // ── Administration ───────────────────────────────────────────────────────
  'feed-sources.manage',
  'subscribers.view', 'subscribers.manage', 'subscribers.delete',
  'visitor-stats.view', 'visitor-stats.delete',
  'contact-submissions.view', 'contact-submissions.manage', 'contact-submissions.publish-qa', 'contact-submissions.delete',
  'donations.view', 'donations.manage', 'donations.config', 'donations.delete',
  'users.view', 'users.manage',
  'audit-log.view',
  'system.maintenance-mode',

  // ── Globals ──────────────────────────────────────────────────────────────
  'globals.site-settings.edit',
  'globals.header.edit',
  'globals.footer.edit',
  'globals.homepage.edit',
  'globals.navigation.edit',
  'globals.about-page.edit',
  'globals.banner-settings.edit',
  'globals.donation-settings.edit',
] as const

export type Permission = (typeof PERMISSIONS)[number]

const PERMISSION_SET = new Set<string>(PERMISSIONS)
export function isKnownPermission(value: string): value is Permission {
  return PERMISSION_SET.has(value)
}

/**
 * Every content permission a chancery-editor holds. Extracted so the preset stays
 * readable; equals "all content .create/.update/.delete/.publish that existed as
 * isChanceryOrAbove before", minus the deletes that were super-admin-only
 * (archives/subscribers/visitor-stats/contact-submissions/donations) and minus
 * the super-only actions (donations.config, *.set_active, users.manage, etc.).
 */
const CHANCERY: Permission[] = [
  'news.create', 'news.update', 'news.delete', 'news.publish',
  'pages.create', 'pages.update', 'pages.delete', 'pages.publish',
  'pope-messages.create', 'pope-messages.update', 'pope-messages.delete', 'pope-messages.publish',
  'bishop-messages.create', 'bishop-messages.update', 'bishop-messages.delete', 'bishop-messages.publish',
  'apps.create', 'apps.update', 'apps.delete', 'apps.publish',
  'offices.create', 'offices.update', 'offices.delete', 'offices.publish',
  'events.create', 'events.update', 'events.delete', 'events.publish',
  'publications.create', 'publications.update', 'publications.delete',
  'magazines.create', 'magazines.update', 'magazines.delete',
  'archives.create', 'archives.update', // archives.delete was super-admin-only
  'priests.create', 'priests.update', 'priests.delete',
  'vicariates.create', 'vicariates.update', 'vicariates.delete',
  'schools.create', 'schools.update', 'schools.delete',
  'clinics.create', 'clinics.update', 'clinics.delete',
  'parishes.create', 'parishes.update', 'parishes.delete',
  'ministries.create', 'ministries.update', 'ministries.delete',
  'children-programs.create', 'children-programs.update', 'children-programs.delete',
  'small-christian-communities.create', 'small-christian-communities.update', 'small-christian-communities.delete',
  'news-categories.manage', 'event-types.manage',
  'geez-calendar.manage', 'geez-calendar.import',
  'media.upload', 'media.delete', 'media.view-restricted',
  'feed-sources.manage',
  'subscribers.view', 'subscribers.manage',
  'visitor-stats.view',
  'contact-submissions.view', 'contact-submissions.manage', 'contact-submissions.publish-qa',
  'donations.view', 'donations.manage',
  'users.view',
  'globals.site-settings.edit', 'globals.header.edit', 'globals.footer.edit',
  'globals.homepage.edit', 'globals.navigation.edit', 'globals.about-page.edit',
  'globals.banner-settings.edit', 'globals.donation-settings.edit',
]

/**
 * Default permissions per role preset (excluding super-admin, which the resolver
 * grants the whole catalog). Preserves pre-existing effective access exactly.
 */
export const PRESET_PERMISSIONS: Record<Exclude<Role, 'super-admin'>, Permission[]> = {
  'chancery-editor': CHANCERY,
  // Parish-editors: parish-scoped events/SCC/parishes writes + ministries + media upload.
  'parish-editor': [
    'events.manage-own',
    'small-christian-communities.manage-own',
    'parishes.update-own',
    'ministries.create', 'ministries.update',
    'media.upload',
  ],
  // Youth & catechist editors are identical today (children-programs + ministries
  // + media upload); kept as separate presets so they can diverge without a migration.
  'youth-editor': [
    'children-programs.create', 'children-programs.update',
    'ministries.create', 'ministries.update',
    'media.upload',
  ],
  'catechist-editor': [
    'children-programs.create', 'children-programs.update',
    'ministries.create', 'ministries.update',
    'media.upload',
  ],
  'media-editor': ['media.upload', 'media.delete', 'media.view-restricted'],
}

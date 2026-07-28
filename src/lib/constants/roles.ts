/**
 * Role definitions for the Eparchy of Segheneyti platform.
 *
 * A role is only a preset — it names a bundle of permissions (see
 * lib/permissions/permissions.ts), and per-user grants/revokes layer on top.
 * Nothing outside the resolver's `super-admin` short-circuit may branch on a
 * role string; ask `hasPermission` instead.
 */

export const ROLES = [
  'super-admin',
  'chancery-editor',
  'parish-editor',
  'youth-editor',
  'catechist-editor',
  'media-editor',
] as const

export type Role = (typeof ROLES)[number]

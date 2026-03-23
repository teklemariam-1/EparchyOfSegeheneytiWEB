/**
 * Role definitions for the Eparchy of Segeneyti platform.
 *
 * Each role is scoped to a specific ministry or operational area.
 * super-admin has unrestricted access to everything.
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

/** Roles that have broad editorial access across the platform */
export const ELEVATED_ROLES: Role[] = ['super-admin', 'chancery-editor']

/** All authenticated editor roles */
export const ALL_EDITOR_ROLES: Role[] = [...ROLES]

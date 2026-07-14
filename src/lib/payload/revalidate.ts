import { revalidatePath, revalidateTag } from 'next/cache'

/**
 * `revalidatePath` throws when called outside a Next.js request/render scope —
 * e.g. from Payload Local API writes in seed scripts or migrations. Collection
 * `afterChange` hooks run in both contexts, so wrap the call to make it a no-op
 * when there's no request scope to revalidate.
 */
export function safeRevalidatePath(path: string, type?: 'layout' | 'page'): void {
  try {
    revalidatePath(path, type)
  } catch {
    // No request scope (seed/migration/Local API) — nothing to revalidate.
  }
}

/** Invalidate a data-cache tag (see cachedQuery). No-ops outside a request scope. */
export function safeRevalidateTag(tag: string): void {
  try {
    revalidateTag(tag)
  } catch {
    // No request scope (seed/migration/Local API) — nothing to revalidate.
  }
}

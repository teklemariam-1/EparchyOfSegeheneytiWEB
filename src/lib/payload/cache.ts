import { unstable_cache } from 'next/cache'

/**
 * Wrap a read-only Payload query in Next.js' data cache.
 *
 * Pages in this app render dynamically (the active locale is read from a
 * cookie), so route-level ISR is a no-op. Caching at the data layer instead
 * keeps the cookie-based language switch while avoiding a database round-trip
 * on every request.
 *
 * The wrapped function MUST be pure w.r.t. request state — it must not read
 * cookies/headers itself; pass the locale (and any other inputs) as arguments,
 * which are folded into the cache key so each locale/param set caches
 * separately.
 *
 * Entries are invalidated after `revalidate` seconds, or immediately via
 * `revalidateTag(tag)` (see safeRevalidateTag) when content is edited.
 */
export function cachedQuery<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  keyName: string,
  tags: string[],
  revalidate = 300,
): (...args: TArgs) => Promise<TResult> {
  return (...args: TArgs) =>
    unstable_cache(
      () => fn(...args),
      [keyName, ...args.map((a) => JSON.stringify(a ?? null))],
      { tags, revalidate },
    )()
}

import '@testing-library/jest-dom'
import { vi } from 'vitest'

// `next/cache` requires the Next.js runtime (incremental cache), which isn't
// present under vitest. Mock it as a passthrough so data-layer caching wrappers
// (see src/lib/payload/cache.ts) run the underlying query directly in tests.
vi.mock('next/cache', () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

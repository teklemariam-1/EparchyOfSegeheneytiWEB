/**
 * The arithmetic that keeps a magazine page a clean rectangle.
 *
 * Both views share one page size so they paginate identically. The featured
 * block consumes FEATURED_COUNT articles and the remainder is drawn in a
 * 4-column grid — but PAGE_SIZE − FEATURED_COUNT does not have to divide by 4,
 * and when it does not the last row is left with a hole. That hole is the bug
 * the previous magazine layout shipped with.
 *
 * Rather than change the page size (which would desynchronise the two views),
 * one card is allowed to span two columns, absorbing the remainder.
 */

/** 1 hero + a 2×2 grid of companions. */
export const FEATURED_COUNT = 5

/** Desktop columns in the grid below the featured block. */
export const GRID_COLUMNS = 4

/**
 * Whether the first card below the featured block should span two columns.
 *
 * True exactly when the remainder would otherwise leave a one-slot hole: with
 * `n % 4 === 3`, widening one card turns n cards into n+1 slots, completing the
 * final row. Any other remainder is left alone — a deliberately wide card on a
 * page that does not need one reads as a mistake.
 */
export function shouldSpanFirstCard(restCount: number): boolean {
  return restCount % GRID_COLUMNS === GRID_COLUMNS - 1
}

/**
 * Grid slots occupied by `restCount` cards once the span is applied. A full
 * page should always land on a multiple of GRID_COLUMNS.
 */
export function occupiedSlots(restCount: number): number {
  return restCount + (shouldSpanFirstCard(restCount) ? 1 : 0)
}

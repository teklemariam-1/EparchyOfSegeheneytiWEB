import { describe, it, expect } from 'vitest'
import { FEATURED_COUNT, GRID_COLUMNS, shouldSpanFirstCard, occupiedSlots } from '../layout'

/**
 * The page-fill invariant.
 *
 * A previous magazine layout carved 5 articles out of a 12-article page and
 * drew the remaining 7 in a 4-column grid, leaving one empty slot on EVERY
 * page. These tests pin the arithmetic that closes that hole, so the bug cannot
 * come back unnoticed if the page size is ever retuned.
 */

const PAGE_SIZE = 12

describe('a full page', () => {
  it('leaves a remainder that would not fill the grid on its own', () => {
    // The premise of the whole fix: 12 − 5 = 7, and 7 % 4 ≠ 0.
    const rest = PAGE_SIZE - FEATURED_COUNT
    expect(rest).toBe(7)
    expect(rest % GRID_COLUMNS).not.toBe(0)
  })

  it('fills completely once one card spans two columns', () => {
    const rest = PAGE_SIZE - FEATURED_COUNT
    expect(shouldSpanFirstCard(rest)).toBe(true)
    expect(occupiedSlots(rest) % GRID_COLUMNS).toBe(0)
  })

  it('occupies exactly two rows', () => {
    expect(occupiedSlots(PAGE_SIZE - FEATURED_COUNT) / GRID_COLUMNS).toBe(2)
  })
})

describe('shouldSpanFirstCard', () => {
  it('spans only when the last row would be one short', () => {
    expect(shouldSpanFirstCard(3)).toBe(true)
    expect(shouldSpanFirstCard(7)).toBe(true)
    expect(shouldSpanFirstCard(11)).toBe(true)
  })

  it('leaves an already-complete remainder alone', () => {
    // A wide card on a page that does not need one reads as a mistake.
    expect(shouldSpanFirstCard(4)).toBe(false)
    expect(shouldSpanFirstCard(8)).toBe(false)
    expect(shouldSpanFirstCard(0)).toBe(false)
  })

  it('does not span for remainders that are short by more than one', () => {
    expect(shouldSpanFirstCard(1)).toBe(false)
    expect(shouldSpanFirstCard(2)).toBe(false)
    expect(shouldSpanFirstCard(5)).toBe(false)
    expect(shouldSpanFirstCard(6)).toBe(false)
  })
})

describe('the featured block', () => {
  it('is one hero plus a 2×2 grid', () => {
    expect(FEATURED_COUNT).toBe(5)
  })

  it('fits inside a page, leaving articles for the grid below', () => {
    expect(FEATURED_COUNT).toBeLessThan(PAGE_SIZE)
  })
})

describe('partial last pages', () => {
  it.each([1, 2, 3, 4, 5])('renders %i article(s) without demanding a grid row', (count) => {
    // Fewer articles than the featured block: everything lands in the featured
    // area, nothing left to span.
    const rest = Math.max(0, count - FEATURED_COUNT)
    expect(rest).toBe(0)
    expect(shouldSpanFirstCard(rest)).toBe(false)
  })

  it.each([
    [6, 1],
    [8, 3],
    [9, 4],
    [12, 7],
  ])('a page of %i leaves %i below the featured block', (total, expectedRest) => {
    expect(total - FEATURED_COUNT).toBe(expectedRest)
  })

  it('never leaves a hole on any page size from 6 to 24', () => {
    for (let total = 6; total <= 24; total++) {
      const rest = total - FEATURED_COUNT
      const slots = occupiedSlots(rest)
      // Either the row is complete, or it is short by more than the one slot a
      // single span could fix — which is a legitimately partial final row, not
      // the off-by-one gap this guards against.
      expect(slots % GRID_COLUMNS).not.toBe(GRID_COLUMNS - 1)
    }
  })
})

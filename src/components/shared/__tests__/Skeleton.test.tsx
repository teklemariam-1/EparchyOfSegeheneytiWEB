import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Skeleton, CardSkeleton, PageHeaderSkeleton } from '../Skeleton'

describe('Skeleton', () => {
  it('renders a div with animate-pulse class', () => {
    const { container } = render(<Skeleton />)
    expect(container.firstChild).toHaveClass('animate-pulse')
  })

  it('has aria-hidden="true" for accessibility', () => {
    const { container } = render(<Skeleton />)
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })

  it('merges additional className onto the element', () => {
    const { container } = render(<Skeleton className="h-10 w-full rounded-xl" />)
    expect(container.firstChild).toHaveClass('h-10', 'w-full', 'rounded-xl')
  })

  it('preserves the base bg-charcoal-100 class', () => {
    const { container } = render(<Skeleton />)
    expect(container.firstChild).toHaveClass('bg-charcoal-100')
  })
})

describe('CardSkeleton', () => {
  it('renders without crashing', () => {
    const { container } = render(<CardSkeleton />)
    expect(container.firstChild).toBeTruthy()
  })

  it('contains multiple skeleton bones', () => {
    const { container } = render(<CardSkeleton />)
    // The card skeleton has one image + several text lines
    const bones = container.querySelectorAll('[aria-hidden="true"]')
    expect(bones.length).toBeGreaterThanOrEqual(4)
  })
})

describe('PageHeaderSkeleton', () => {
  it('renders without crashing', () => {
    const { container } = render(<PageHeaderSkeleton />)
    expect(container.firstChild).toBeTruthy()
  })

  it('contains skeleton bones with maroon background', () => {
    const { container } = render(<PageHeaderSkeleton />)
    const maroonBones = container.querySelectorAll('.bg-maroon-700')
    expect(maroonBones.length).toBeGreaterThanOrEqual(1)
  })
})

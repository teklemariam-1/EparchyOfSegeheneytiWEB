import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FilterBar } from '../FilterBar'

// Use vi.hoisted so mockPush is defined before vi.mock's factory executes
const mockPush = vi.hoisted(() => vi.fn())

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/news',
  useSearchParams: () => new URLSearchParams(''),
}))

const OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'eparchy', label: 'Eparchy' },
  { value: 'vatican', label: 'Vatican' },
  { value: 'community', label: 'Community' },
]

describe('FilterBar', () => {
  beforeEach(() => {
    mockPush.mockClear()
  })

  it('renders every option as a button', () => {
    render(<FilterBar options={OPTIONS} paramName="category" />)
    OPTIONS.forEach(({ label }) => {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument()
    })
  })

  it('marks "all" as active (aria-pressed=true) by default when no param is set', () => {
    render(<FilterBar options={OPTIONS} paramName="category" />)
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('marks non-active options as aria-pressed=false', () => {
    render(<FilterBar options={OPTIONS} paramName="category" />)
    expect(screen.getByRole('button', { name: 'Eparchy' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('calls router.push with the correct URL when a non-all option is clicked', () => {
    render(<FilterBar options={OPTIONS} paramName="category" />)
    fireEvent.click(screen.getByRole('button', { name: 'Eparchy' }))
    expect(mockPush).toHaveBeenCalledWith('/news?category=eparchy')
  })

  it('calls router.push with the bare pathname when "all" is clicked', () => {
    render(<FilterBar options={OPTIONS} paramName="category" />)
    fireEvent.click(screen.getByRole('button', { name: 'All' }))
    expect(mockPush).toHaveBeenCalledWith('/news')
  })

  it('applies a custom className to the container', () => {
    const { container } = render(
      <FilterBar options={OPTIONS} paramName="category" className="custom-class" />,
    )
    expect(container.firstChild).toHaveClass('custom-class')
  })
})

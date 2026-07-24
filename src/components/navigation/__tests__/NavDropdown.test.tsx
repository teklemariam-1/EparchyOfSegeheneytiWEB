import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NavDropdown } from '../NavDropdown'

const items = [
  { label: 'Overview', href: '/about' },
  { label: 'The Bishop', href: '/about#bishop' },
]

describe('NavDropdown (keyboard/touch accessibility)', () => {
  it('starts collapsed with aria-expanded=false', () => {
    render(<NavDropdown label="About" items={items} />)
    expect(screen.getByRole('button', { name: /about/i })).toHaveAttribute('aria-expanded', 'false')
  })

  it('opens on click and toggles aria-expanded', async () => {
    const user = userEvent.setup()
    render(<NavDropdown label="About" items={items} />)
    const btn = screen.getByRole('button', { name: /about/i })
    await user.click(btn)
    expect(btn).toHaveAttribute('aria-expanded', 'true')
    await user.click(btn)
    expect(btn).toHaveAttribute('aria-expanded', 'false')
  })

  it('opens with ArrowDown and moves focus into the menu', async () => {
    const user = userEvent.setup()
    render(<NavDropdown label="About" items={items} />)
    const btn = screen.getByRole('button', { name: /about/i })
    btn.focus()
    await user.keyboard('{ArrowDown}')
    expect(btn).toHaveAttribute('aria-expanded', 'true')
    const firstItem = screen.getByRole('menuitem', { name: 'Overview' })
    expect(firstItem).toHaveFocus()
  })

  it('closes on Escape and restores focus to the trigger', async () => {
    const user = userEvent.setup()
    render(<NavDropdown label="About" items={items} />)
    const btn = screen.getByRole('button', { name: /about/i })
    await user.click(btn)
    await user.keyboard('{Escape}')
    expect(btn).toHaveAttribute('aria-expanded', 'false')
    expect(btn).toHaveFocus()
  })

  it('exposes the children as menu items linking to their hrefs', async () => {
    const user = userEvent.setup()
    render(<NavDropdown label="About" items={items} />)
    await user.click(screen.getByRole('button', { name: /about/i }))
    const links = screen.getAllByRole('menuitem')
    expect(links.map((l) => l.getAttribute('href'))).toEqual(['/about', '/about#bishop'])
  })
})

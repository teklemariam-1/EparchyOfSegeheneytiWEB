import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ContactForm } from '../ContactForm'

// Mock the server action — ContactForm imports it to pass to useActionState
vi.mock('@/app/actions/contact', () => ({
  submitContactForm: vi.fn().mockResolvedValue({ ok: false, message: '' }),
}))

describe('ContactForm — initial render', () => {
  it('renders an accessible form element', () => {
    render(<ContactForm />)
    expect(screen.getByRole('form', { name: /Contact form/i })).toBeInTheDocument()
  })

  it('renders a First Name input', () => {
    render(<ContactForm />)
    expect(screen.getByRole('textbox', { name: /First Name/i })).toBeInTheDocument()
  })

  it('renders a Last Name input', () => {
    render(<ContactForm />)
    expect(screen.getByRole('textbox', { name: /Last Name/i })).toBeInTheDocument()
  })

  it('renders an Email input', () => {
    render(<ContactForm />)
    expect(screen.getByRole('textbox', { name: /Email/i })).toBeInTheDocument()
  })

  it('renders a Phone input (optional)', () => {
    render(<ContactForm />)
    // type="tel" — accessible via label
    expect(screen.getByLabelText(/Phone/i)).toBeInTheDocument()
  })

  it('renders a Subject select', () => {
    render(<ContactForm />)
    expect(screen.getByLabelText(/Subject/i)).toBeInTheDocument()
  })

  it('renders a Message textarea', () => {
    render(<ContactForm />)
    expect(screen.getByRole('textbox', { name: /Message/i })).toBeInTheDocument()
  })

  it('renders the Send Message submit button', () => {
    render(<ContactForm />)
    expect(screen.getByRole('button', { name: /Send Message/i })).toBeInTheDocument()
  })

  it('submit button has type="submit"', () => {
    render(<ContactForm />)
    expect(screen.getByRole('button', { name: /Send Message/i })).toHaveAttribute(
      'type',
      'submit',
    )
  })

  it('does not show an error banner on initial render', () => {
    render(<ContactForm />)
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('does not show the success state on initial render', () => {
    render(<ContactForm />)
    // Success state renders "Message Sent" heading
    expect(screen.queryByText(/Message Sent/i)).toBeNull()
  })
})

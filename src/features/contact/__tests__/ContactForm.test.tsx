import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NextIntlClientProvider } from 'next-intl'
import type { ReactElement } from 'react'
import { ContactForm } from '../ContactForm'
import messages from '../../../../messages/en.json'

// Mock the server action — ContactForm imports it to pass to useActionState
vi.mock('@/app/actions/contact', () => ({
  submitContactForm: vi.fn().mockResolvedValue({ ok: false, message: '' }),
}))

// ContactForm reads its labels via next-intl, so render it inside a provider.
const renderForm = (ui: ReactElement = <ContactForm />) =>
  render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>,
  )

describe('ContactForm — initial render', () => {
  it('renders an accessible form element', () => {
    renderForm()
    expect(screen.getByRole('form', { name: /Contact Us/i })).toBeInTheDocument()
  })

  it('renders a First Name input', () => {
    renderForm()
    expect(screen.getByRole('textbox', { name: /First Name/i })).toBeInTheDocument()
  })

  it('renders a Last Name input', () => {
    renderForm()
    expect(screen.getByRole('textbox', { name: /Last Name/i })).toBeInTheDocument()
  })

  it('renders an Email input', () => {
    renderForm()
    expect(screen.getByRole('textbox', { name: /Email/i })).toBeInTheDocument()
  })

  it('renders a Phone input (optional)', () => {
    renderForm()
    expect(screen.getByLabelText(/Phone/i)).toBeInTheDocument()
  })

  it('renders a Subject select', () => {
    renderForm()
    expect(screen.getByLabelText(/Subject/i)).toBeInTheDocument()
  })

  it('renders a Message textarea', () => {
    renderForm()
    expect(screen.getByRole('textbox', { name: /Message/i })).toBeInTheDocument()
  })

  it('renders the Send Message submit button', () => {
    renderForm()
    expect(screen.getByRole('button', { name: /Send Message/i })).toBeInTheDocument()
  })

  it('submit button has type="submit"', () => {
    renderForm()
    expect(screen.getByRole('button', { name: /Send Message/i })).toHaveAttribute('type', 'submit')
  })

  it('does not show an error banner on initial render', () => {
    renderForm()
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('does not show the success state on initial render', () => {
    renderForm()
    expect(screen.queryByText(/Message Sent/i)).toBeNull()
  })

  it('localizes the subject options via the message catalogue', () => {
    renderForm()
    expect(screen.getByRole('option', { name: 'General Enquiry' })).toHaveValue('General Enquiry')
  })
})

import type { EmailAdapter, SendEmailOptions } from 'payload'
import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'

const defaultFromAddress = process.env.PAYLOAD_FROM_ADDRESS ?? 'noreply@segeneyti.org'
const defaultFromName = process.env.PAYLOAD_FROM_NAME ?? 'Eparchy of Segeneyti CMS'

function normalizeAddress(value: SendEmailOptions['to'] | SendEmailOptions['cc'] | SendEmailOptions['bcc'] | SendEmailOptions['replyTo'] | SendEmailOptions['from']): string[] {
  if (!value) {
    return []
  }

  const values = Array.isArray(value) ? value : [value]

  return values
    .map((entry) => {
      if (typeof entry === 'string') {
        return entry
      }

      if (entry && typeof entry === 'object' && 'address' in entry && typeof entry.address === 'string') {
        return entry.address
      }

      return null
    })
    .filter((entry): entry is string => Boolean(entry))
}

function getFromAddress(message: SendEmailOptions): string {
  const from = normalizeAddress(message.from)
  return from[0] ?? `${defaultFromName} <${defaultFromAddress}>`
}

/**
 * Determine which email transport to use:
 * 1. RESEND_API_KEY → Resend HTTP API (recommended for Vercel)
 * 2. SMTP_HOST → SMTP via nodemailer (works with Gmail, SendGrid, Mailgun, etc.)
 * 3. Neither → log-only mode (development)
 */
function getTransportMode(): 'resend' | 'smtp' | 'log' {
  if (process.env.RESEND_API_KEY) return 'resend'
  if (process.env.SMTP_HOST) return 'smtp'
  return 'log'
}

let smtpTransporter: Transporter | null = null

function getSmtpTransporter(): Transporter {
  if (smtpTransporter) return smtpTransporter

  smtpTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER ?? '',
      pass: process.env.SMTP_PASS ?? '',
    },
  })

  return smtpTransporter
}

/**
 * Validate email configuration at startup and warn about issues.
 */
export function validateEmailConfig(): { mode: 'resend' | 'smtp' | 'log'; warnings: string[] } {
  const mode = getTransportMode()
  const warnings: string[] = []

  if (mode === 'log' && process.env.NODE_ENV === 'production') {
    warnings.push('No email transport configured in production. Password reset emails will only be logged, not sent.')
  }

  if (mode === 'smtp') {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      warnings.push('SMTP_HOST is set but SMTP_USER/SMTP_PASS are missing. Authentication may fail.')
    }
  }

  return { mode, warnings }
}

export const buildEmailAdapter: EmailAdapter = ({ payload }) => ({
  name: 'eparchy-email',
  defaultFromAddress,
  defaultFromName,
  async sendEmail(message) {
    const to = normalizeAddress(message.to)
    const cc = normalizeAddress(message.cc)
    const bcc = normalizeAddress(message.bcc)
    const replyTo = normalizeAddress(message.replyTo)
    const subject = message.subject ?? '(no subject)'
    const from = getFromAddress(message)

    if (to.length === 0) {
      throw new Error('Payload email adapter requires at least one recipient.')
    }

    const mode = getTransportMode()

    // ── Log-only mode (development without real email) ──────────────
    if (mode === 'log') {
      payload.logger.info('──────── EMAIL (log-only mode) ────────')
      payload.logger.info(`From: ${from}`)
      payload.logger.info(`To: ${to.join(', ')}`)
      payload.logger.info(`Subject: ${subject}`)
      if (message.html) {
        // Extract reset links from HTML for easy development usage
        const linkMatch = typeof message.html === 'string' ? message.html.match(/href="([^"]*reset[^"]*)"/) : null
        if (linkMatch) {
          payload.logger.info(`🔗 Reset link: ${linkMatch[1]}`)
        }
      }
      if (message.text) {
        payload.logger.info(message.text)
      }
      payload.logger.info('──────── END EMAIL ────────')
      return { logged: true, subject, to }
    }

    // ── Resend HTTP API ─────────────────────────────────────────────
    if (mode === 'resend') {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to,
          cc: cc.length > 0 ? cc : undefined,
          bcc: bcc.length > 0 ? bcc : undefined,
          reply_to: replyTo.length > 0 ? replyTo : undefined,
          subject,
          html: message.html ?? undefined,
          text: message.text ?? undefined,
        }),
      })

      const body = await response.text()

      if (!response.ok) {
        payload.logger.error(`Resend email send failed with status ${response.status}: ${body}`)
        throw new Error(`Resend email send failed with status ${response.status}`)
      }

      payload.logger.info(`Email sent via Resend to ${to.join(', ')} — subject: ${subject}`)
      return body ? JSON.parse(body) : { ok: true }
    }

    // ── SMTP via nodemailer ─────────────────────────────────────────
    const transporter = getSmtpTransporter()
    const info = await transporter.sendMail({
      from,
      to: to.join(', '),
      cc: cc.length > 0 ? cc.join(', ') : undefined,
      bcc: bcc.length > 0 ? bcc.join(', ') : undefined,
      replyTo: replyTo.length > 0 ? replyTo.join(', ') : undefined,
      subject,
      html: typeof message.html === 'string' ? message.html : undefined,
      text: typeof message.text === 'string' ? message.text : undefined,
    })

    payload.logger.info(`Email sent via SMTP to ${to.join(', ')} — messageId: ${info.messageId}`)
    return { messageId: info.messageId }
  },
})
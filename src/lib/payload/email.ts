import type { EmailAdapter, SendEmailOptions } from 'payload'

const defaultFromAddress = process.env.PAYLOAD_FROM_ADDRESS ?? 'onboarding@resend.dev'
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
  return from[0] ?? defaultFromAddress
}

export const buildEmailAdapter: EmailAdapter = ({ payload }) => ({
  name: 'resend-or-log',
  defaultFromAddress,
  defaultFromName,
  async sendEmail(message) {
    const to = normalizeAddress(message.to)
    const cc = normalizeAddress(message.cc)
    const bcc = normalizeAddress(message.bcc)
    const replyTo = normalizeAddress(message.replyTo)
    const subject = message.subject ?? '(no subject)'

    if (to.length === 0) {
      throw new Error('Payload email adapter requires at least one recipient.')
    }

    if (!process.env.RESEND_API_KEY) {
      payload.logger.info('Payload email adapter is running in log-only mode because RESEND_API_KEY is not set.')
      payload.logger.info(`To: ${to.join(', ')}`)
      payload.logger.info(`Subject: ${subject}`)

      if (message.text) {
        payload.logger.info(message.text)
      }

      if (message.html) {
        payload.logger.info(message.html)
      }

      return {
        logged: true,
        subject,
        to,
      }
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: getFromAddress(message),
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

    return body ? JSON.parse(body) : { ok: true }
  },
})
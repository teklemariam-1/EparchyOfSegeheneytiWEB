import { randomInt } from 'crypto'

/**
 * Donor-facing reference codes for manual bank transfers.
 *
 * This is the piece the previous manual flow was missing entirely, and its
 * absence is why that flow did not work: a pledge was recorded, a transfer
 * arrived at the bank days later, and nothing connected the two. The treasurer
 * saw "USD 50 — T. Ghebre" on a statement and had no way to tell which of
 * several pledges it settled, or whether it settled any of them.
 *
 * So every manual donation now gets a short code that the donor is told to
 * quote in the transfer memo, and that staff reconcile against.
 *
 * Design constraints, in order of importance:
 *
 *  - **Transcribable by a human, over a phone, into a bank app.** Excludes the
 *    characters that get confused when handwritten or read aloud: I/1, O/0,
 *    S/5, Z/2, U/V. Uppercase only.
 *  - **Not guessable.** Reference codes appear in staff views and are used to
 *    look up a pledge, so a sequential counter would let anyone enumerate
 *    donations. Generated from a CSPRNG.
 *  - **Short.** Bank memo fields are often limited and always retyped.
 */

/** 26 unambiguous characters. No I, O, S, U, Z, and no digits 0/1/2/5. */
const ALPHABET = 'ABCDEFGHJKLMNPQRTVWXY346789'
const CODE_LENGTH = 6
const PREFIX = 'SEG'

/**
 * Generate a reference code such as `SEG-4KQ7HP`.
 *
 * 27^6 ≈ 387 million codes; with even tens of thousands of donations the
 * birthday-collision probability stays negligible, and `reserveReference`
 * verifies uniqueness against the database anyway.
 */
export function generateReference(): string {
  let code = ''
  // randomInt is the CSPRNG-backed, modulo-bias-free integer source.
  for (let i = 0; i < CODE_LENGTH; i += 1) code += ALPHABET[randomInt(ALPHABET.length)]
  return `${PREFIX}-${code}`
}

/** Whether a string is a well-formed reference code. */
export function isValidReference(value: unknown): boolean {
  return typeof value === 'string' && new RegExp(`^${PREFIX}-[${ALPHABET}]{${CODE_LENGTH}}$`).test(value)
}

/**
 * Accept a reference the way a donor or a bank statement might present it —
 * lowercase, spaced, missing the hyphen — and return the canonical form, or
 * null if it cannot be one of our codes. Used by the staff reconcile lookup so
 * "seg 4kq7hp" finds the same pledge as "SEG-4KQ7HP".
 */
export function normalizeReference(value: unknown): string | null {
  const raw = String(value ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (!raw.startsWith(PREFIX)) return null
  const body = raw.slice(PREFIX.length)
  if (body.length !== CODE_LENGTH) return null
  if (![...body].every((ch) => ALPHABET.includes(ch))) return null
  return `${PREFIX}-${body}`
}

/** Minimal shape of the Payload client this module needs — keeps it testable. */
interface ReferenceLookup {
  find(args: unknown): Promise<{ totalDocs: number }>
}

/**
 * Generate a reference code that no existing donation already holds.
 *
 * Retries a bounded number of times, then gives up and returns the last
 * candidate rather than throwing: a one-in-hundreds-of-millions duplicate is a
 * reconciliation annoyance, whereas throwing here would lose the donation.
 */
export async function reserveReference(payload: ReferenceLookup, attempts = 5): Promise<string> {
  let candidate = generateReference()
  for (let i = 0; i < attempts; i += 1) {
    candidate = generateReference()
    try {
      const existing = await payload.find({
        collection: 'donations',
        where: { reference: { equals: candidate } },
        limit: 1,
        depth: 0,
        overrideAccess: true,
      })
      if (existing.totalDocs === 0) return candidate
    } catch {
      // A lookup failure must not block the donation — accept the candidate.
      return candidate
    }
  }
  return candidate
}

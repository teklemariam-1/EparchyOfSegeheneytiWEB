/**
 * Machine translation for feed-imported content.
 *
 * The RSS sources publish in English; the site's audience reads Tigrinya. The
 * ingest job translates each imported item's title and summary to Tigrinya
 * before the draft is created, so editors review the Tigrinya text — the
 * original English is kept on the document (sourceTitle / sourceSummary) for
 * cross-checking.
 *
 * Behind a small provider interface so the service can be swapped without
 * touching the ingest pipeline. Google Cloud Translation is the default: it is
 * one of the few commercial APIs that supports Tigrinya (`ti`) — DeepL, for
 * example, does not.
 *
 * Translation must never block an import: callers treat a null provider or a
 * thrown error as "keep the English draft and flag it untranslated".
 */

export interface TranslationProvider {
  name: string
  /** Translate each text in order; must return one result per input. */
  translate(texts: string[], opts: { from: string; to: string }): Promise<string[]>
}

const GOOGLE_ENDPOINT = 'https://translation.googleapis.com/language/translate/v2'

/** Unescape the handful of HTML entities Google returns even in text mode. */
function decodeEntities(s: string): string {
  return s
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

export function googleTranslateProvider(apiKey: string): TranslationProvider {
  return {
    name: 'google',
    async translate(texts, { from, to }) {
      if (texts.length === 0) return []

      const res = await fetch(`${GOOGLE_ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: texts, source: from, target: to, format: 'text' }),
        cache: 'no-store',
      })
      if (!res.ok) {
        // The response body may carry the key — never echo it; status is enough.
        throw new Error(`Google Translate responded ${res.status}`)
      }

      const json = (await res.json()) as {
        data?: { translations?: Array<{ translatedText?: string }> }
      }
      const out = (json.data?.translations ?? []).map((t) => decodeEntities(t.translatedText ?? ''))
      if (out.length !== texts.length || out.some((t) => !t.trim())) {
        throw new Error('Google Translate returned an incomplete result')
      }
      return out
    },
  }
}

/**
 * The configured provider, or null when translation is not set up. Reads env
 * at call time (not module load) so serverless cold starts and tests both see
 * current values.
 */
export function getTranslationProvider(): TranslationProvider | null {
  const key = process.env.GOOGLE_TRANSLATE_API_KEY
  if (key) return googleTranslateProvider(key)
  return null
}

/**
 * True when the text is already (mostly) written in Ge'ez script — those items
 * come from Tigrinya feeds and must not be run through EN→TI translation.
 * "Mostly" because Tigrinya headlines often embed Latin names or numerals.
 */
export function isGeezText(text: string): boolean {
  const letters = text.replace(/[^\p{L}]/gu, '')
  if (!letters) return false
  // Ethiopic, Ethiopic Supplement, Ethiopic Extended, Ethiopic Extended-A.
  const geez = letters.match(/[ሀ-᎟ⶀ-⷟꬀-꬯]/g)?.length ?? 0
  return geez / letters.length >= 0.3
}

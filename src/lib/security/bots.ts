/**
 * Crawler / automation detection for the analytics pipeline.
 *
 * Scope note, so this is not mistaken for a security control: this is an
 * ANALYTICS HYGIENE filter, not a defence. It reads the user-agent, which is
 * attacker-controlled — anything that wants to be counted as human simply says
 * it is. It reliably removes honest crawlers (Googlebot, uptime monitors,
 * scrapers that identify themselves) so the human numbers mean something.
 *
 * Blocking abusive traffic is the rate limiter's job (./rateLimit), and
 * distinguishing headless browsers from people is the WAF's (see docs/security.md).
 */

/**
 * Substrings that identify a non-human client, matched case-insensitively.
 *
 * Kept as one list so adding a newly-seen crawler is a one-line change. Ordered
 * roughly by expected frequency — the common search engines first, since the
 * scan short-circuits on the first match.
 */
export const BOT_SIGNATURES = [
  // Search engines
  'googlebot', 'bingbot', 'yandexbot', 'duckduckbot', 'baiduspider', 'slurp',
  'applebot', 'petalbot', 'sogou', 'exabot', 'ia_archiver',
  // Social / messaging link unfurlers
  'facebookexternalhit', 'facebookcatalog', 'twitterbot', 'linkedinbot',
  'whatsapp', 'telegrambot', 'slackbot', 'discordbot', 'skypeuripreview',
  'pinterest', 'redditbot', 'embedly', 'quora link preview',
  // SEO / marketing crawlers
  'ahrefsbot', 'semrushbot', 'mj12bot', 'dotbot', 'rogerbot', 'screaming frog',
  'seznambot', 'blexbot', 'dataforseo', 'serpstatbot', 'zoominfobot',
  // AI / dataset crawlers
  'gptbot', 'chatgpt-user', 'ccbot', 'anthropic-ai', 'claudebot', 'perplexitybot',
  'google-extended', 'bytespider', 'amazonbot', 'diffbot', 'omgili',
  // Monitoring / infrastructure
  'uptimerobot', 'pingdom', 'statuscake', 'site24x7', 'newrelicpinger',
  'datadog', 'betteruptime', 'vercel-screenshot', 'vercel-favicon',
  // Generic automation clients — these are what scripted abuse usually sends
  'curl/', 'wget/', 'python-requests', 'python-urllib', 'aiohttp', 'httpx',
  'go-http-client', 'java/', 'okhttp', 'axios/', 'node-fetch', 'got (',
  'guzzlehttp', 'libwww-perl', 'apache-httpclient', 'postmanruntime', 'insomnia',
  'headlesschrome', 'phantomjs', 'scrapy', 'puppeteer', 'playwright', 'selenium',
  // Catch-all tokens: deliberately last, since they are the broadest
  'bot', 'crawler', 'spider', 'crawl', 'scraper', 'fetcher', 'monitor',
] as const

/**
 * Whether a user-agent looks like a crawler or scripted client.
 *
 * A MISSING user-agent counts as a bot. Every real browser sends one; its
 * absence is the signature of a scripted `curl`/`fetch` call, which is exactly
 * the traffic that was inflating the counters.
 */
export function isBot(userAgent: string | null | undefined): boolean {
  if (userAgent === null || userAgent === undefined) return true
  const ua = userAgent.trim().toLowerCase()
  if (ua === '') return true
  return BOT_SIGNATURES.some((signature) => ua.includes(signature))
}

/**
 * A coarse bucket naming the bot, for the `bot` analytics dimension.
 *
 * Returns the matched signature so crawl volume stays visible per-crawler
 * without storing the raw user-agent (which is fingerprintable, and this
 * collection holds no PII). Unmatched-but-filtered clients bucket as 'other'.
 */
export function botLabel(userAgent: string | null | undefined): string {
  if (!userAgent || userAgent.trim() === '') return 'no-user-agent'
  const ua = userAgent.toLowerCase()
  const match = BOT_SIGNATURES.find((signature) => ua.includes(signature))
  if (!match) return 'other'
  // Trim the punctuation carried by client tokens like 'curl/' or 'got ('.
  return match.replace(/[/(]$/, '').trim()
}

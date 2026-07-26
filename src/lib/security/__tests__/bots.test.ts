import { describe, it, expect } from 'vitest'
import { isBot, botLabel, BOT_SIGNATURES } from '../bots'

/**
 * The bot filter decides which traffic reaches the human analytics counters, so
 * a false positive quietly erases real visitors from the numbers the eparchy
 * uses to make decisions. Both directions are tested.
 */

// Real user-agent strings, including the ones this audience actually uses:
// older Android handsets and in-app browsers are common in the diaspora.
const HUMAN_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 10; SM-A105F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0',
  'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.82 Mobile Safari/537.36',
]

const BOT_AGENTS = [
  'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
  'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
  'Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)',
  'Mozilla/5.0 (compatible; GPTBot/1.0; +https://openai.com/gptbot)',
  'curl/8.4.0',
  'Wget/1.21.3',
  'python-requests/2.31.0',
  'Go-http-client/2.0',
  'PostmanRuntime/7.37.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/120.0.0.0 Safari/537.36',
  'UptimeRobot/2.0; http://www.uptimerobot.com/',
]

describe('isBot', () => {
  it.each(HUMAN_AGENTS)('treats a real browser as human: %s', (ua) => {
    expect(isBot(ua)).toBe(false)
  })

  it.each(BOT_AGENTS)('flags automation: %s', (ua) => {
    expect(isBot(ua)).toBe(true)
  })

  it('treats a missing user-agent as a bot', () => {
    // The signature of the scripted POST that was inflating the counters:
    // every real browser sends one.
    expect(isBot(null)).toBe(true)
    expect(isBot(undefined)).toBe(true)
    expect(isBot('')).toBe(true)
    expect(isBot('   ')).toBe(true)
  })

  it('matches regardless of case', () => {
    expect(isBot('GOOGLEBOT/2.1')).toBe(true)
    expect(isBot('CURL/8.4.0')).toBe(true)
  })
})

describe('botLabel', () => {
  it('names the crawler so crawl volume stays readable', () => {
    expect(botLabel('Mozilla/5.0 (compatible; Googlebot/2.1)')).toBe('googlebot')
    expect(botLabel('facebookexternalhit/1.1')).toBe('facebookexternalhit')
  })

  it('strips the punctuation carried by client tokens', () => {
    // 'curl/' and 'got (' are stored as bare names, not as fragments.
    expect(botLabel('curl/8.4.0')).toBe('curl')
    expect(botLabel('got (https://github.com/sindresorhus/got)')).toBe('got')
  })

  it('distinguishes a missing agent from an unrecognized one', () => {
    expect(botLabel(null)).toBe('no-user-agent')
    expect(botLabel('')).toBe('no-user-agent')
    expect(botLabel('Some Unknown Client 1.0')).toBe('other')
  })

  it('never returns a raw user-agent — the label is a bucket, not a fingerprint', () => {
    const ua = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
    expect(botLabel(ua)).not.toContain('Mozilla')
    expect(botLabel(ua).length).toBeLessThan(40)
  })
})

describe('the signature list', () => {
  it('holds no duplicates', () => {
    expect(new Set(BOT_SIGNATURES).size).toBe(BOT_SIGNATURES.length)
  })

  it('is entirely lower-case, since matching lower-cases the agent', () => {
    for (const signature of BOT_SIGNATURES) {
      expect(signature).toBe(signature.toLowerCase())
    }
  })

  it('contains no substring so short it would match real browsers', () => {
    // A signature like 'go' would match 'Mozilla/5.0 … Gecko'. Guard the list
    // against a careless addition.
    for (const signature of BOT_SIGNATURES) {
      expect(signature.length).toBeGreaterThanOrEqual(3)
    }
  })
})

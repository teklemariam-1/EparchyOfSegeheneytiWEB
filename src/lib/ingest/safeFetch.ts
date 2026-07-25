/**
 * SSRF-guarded fetch for the RSS ingest paths.
 *
 * Feed and image URLs come from staff-entered feed sources and from third-party
 * feed XML, so a fetch could be aimed at internal infrastructure (cloud
 * metadata at 169.254.169.254, localhost, RFC-1918 hosts). Before fetching we
 * resolve the host and reject private/reserved addresses, and every request
 * carries a timeout so a slow endpoint can't hang the function.
 *
 * Residual (accepted): native fetch re-resolves DNS and follows redirects, so
 * DNS-rebinding or a redirect to a private host isn't fully closed. This blocks
 * the direct-URL vector, which is the one that was reachable here.
 */

import { lookup } from 'node:dns/promises'

/** True for private, loopback, link-local, CGNAT, multicast or reserved IPv4. */
export function ipv4IsPrivate(ip: string): boolean {
  const p = ip.split('.').map((n) => Number(n))
  if (p.length !== 4 || p.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return true
  const [a, b] = p as [number, number, number, number]
  if (a === 0 || a === 10 || a === 127) return true // this-network, private, loopback
  if (a === 169 && b === 254) return true // link-local incl. 169.254.169.254 metadata
  if (a === 172 && b >= 16 && b <= 31) return true // private
  if (a === 192 && b === 168) return true // private
  if (a === 192 && b === 0) return true // 192.0.0.0/24 protocol assignments
  if (a === 100 && b >= 64 && b <= 127) return true // CGNAT 100.64/10
  if (a === 198 && (b === 18 || b === 19)) return true // benchmarking
  if (a >= 224) return true // multicast (224/4) + reserved (240/4)
  return false
}

/** True for loopback, unique-local, link-local, multicast or IPv4-mapped-private IPv6. */
export function ipIsPrivate(address: string, family: number): boolean {
  if (family === 4) return ipv4IsPrivate(address)
  const ip = address.toLowerCase()
  if (ip === '::1' || ip === '::') return true
  const mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
  if (mapped) return ipv4IsPrivate(mapped[1]!)
  const head = ip.split(':')[0] ?? ''
  if (/^f[cd]/.test(head)) return true // fc00::/7 unique-local
  if (/^fe[89ab]/.test(head)) return true // fe80::/10 link-local
  if (/^ff/.test(head)) return true // ff00::/8 multicast
  return false
}

/** Validate a URL is http(s) and resolves only to public addresses, or throw. */
export async function assertPublicUrl(input: string): Promise<URL> {
  let url: URL
  try {
    url = new URL(input)
  } catch {
    throw new Error('Invalid URL')
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Only http(s) URLs are allowed')
  }
  const host = url.hostname.replace(/^\[|\]$/g, '') // strip IPv6 brackets
  if (/^(localhost|.*\.local|.*\.internal|.*\.localhost)$/i.test(host)) {
    throw new Error('Refusing to fetch a local address')
  }
  let addrs: Array<{ address: string; family: number }>
  try {
    addrs = await lookup(host, { all: true })
  } catch {
    throw new Error('Could not resolve host')
  }
  if (addrs.length === 0) throw new Error('Host did not resolve')
  for (const { address, family } of addrs) {
    if (ipIsPrivate(address, family)) {
      throw new Error('Refusing to fetch a private or reserved address')
    }
  }
  return url
}

/** Honest bot identifier sent on every ingest request unless a caller overrides it. */
export const DEFAULT_USER_AGENT =
  'EparchyOfSegeneyti-NewsBot/1.0 (+https://eparchy-of-segeheneyti-web.vercel.app)'

/** fetch() after the SSRF guard, with a hard timeout (default 10s). */
export async function safeFetch(
  input: string,
  init: RequestInit = {},
  timeoutMs = 10_000,
): Promise<Response> {
  await assertPublicUrl(input)
  // Guarantee a User-Agent — some feed hosts (and CDNs/WAFs) 403 requests that
  // send none. Callers can still override by passing their own header.
  const headers = new Headers(init.headers)
  if (!headers.has('user-agent')) headers.set('User-Agent', DEFAULT_USER_AGENT)
  return fetch(input, { ...init, headers, redirect: 'follow', signal: AbortSignal.timeout(timeoutMs) })
}

export interface RetryOptions {
  timeoutMs?: number
  /** Total attempts including the first. Default 3. */
  attempts?: number
  /** Base backoff in ms; doubles each retry. Default 400. */
  backoffMs?: number
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * safeFetch with retry + exponential backoff.
 *
 * Retries transient failures — network errors, timeouts, 429 and 5xx — so a
 * single slow response or blip doesn't mark an otherwise-healthy source as
 * failing. 4xx (other than 429) are returned immediately: they won't fix
 * themselves on retry. SSRF/validation errors from assertPublicUrl are never
 * retried.
 */
export async function safeFetchWithRetry(
  input: string,
  init: RequestInit = {},
  { timeoutMs = 10_000, attempts = 3, backoffMs = 400 }: RetryOptions = {},
): Promise<Response> {
  let lastError: unknown
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const res = await safeFetch(input, init, timeoutMs)
      if (res.ok || (res.status !== 429 && res.status < 500)) return res
      lastError = new Error(`HTTP ${res.status}`)
    } catch (err) {
      // A non-ret[r]yable SSRF/protocol rejection should surface immediately.
      const msg = String((err as Error)?.message ?? err)
      if (/Only http|private or reserved|local address|Invalid URL|resolve/i.test(msg)) throw err
      lastError = err
    }
    if (attempt < attempts) await sleep(backoffMs * 2 ** (attempt - 1))
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError))
}

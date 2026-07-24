import { describe, it, expect } from 'vitest'
import { ipv4IsPrivate, ipIsPrivate, assertPublicUrl } from '../safeFetch'

describe('ipv4IsPrivate', () => {
  it('flags private, loopback, link-local, CGNAT, multicast, reserved', () => {
    for (const ip of [
      '10.0.0.1', '172.16.5.4', '172.31.255.255', '192.168.1.1',
      '127.0.0.1', '0.0.0.0', '169.254.169.254', // cloud metadata
      '100.64.0.1', '198.18.0.1', '224.0.0.1', '240.0.0.1', '192.0.0.1',
    ]) {
      expect(ipv4IsPrivate(ip), ip).toBe(true)
    }
  })
  it('allows public addresses', () => {
    for (const ip of ['8.8.8.8', '1.1.1.1', '104.16.0.1', '172.15.0.1', '172.32.0.1', '192.167.0.1']) {
      expect(ipv4IsPrivate(ip), ip).toBe(false)
    }
  })
  it('treats malformed input as unsafe', () => {
    expect(ipv4IsPrivate('999.1.1.1')).toBe(true)
    expect(ipv4IsPrivate('nonsense')).toBe(true)
  })
})

describe('ipIsPrivate (IPv6)', () => {
  it('flags loopback, unique-local, link-local, multicast, mapped-private', () => {
    for (const ip of ['::1', '::', 'fc00::1', 'fd12:3456::1', 'fe80::1', 'ff02::1', '::ffff:127.0.0.1']) {
      expect(ipIsPrivate(ip, 6), ip).toBe(true)
    }
  })
  it('allows public IPv6 and mapped-public', () => {
    expect(ipIsPrivate('2606:4700:4700::1111', 6)).toBe(false)
    expect(ipIsPrivate('::ffff:8.8.8.8', 6)).toBe(false)
  })
})

describe('assertPublicUrl', () => {
  it('rejects non-http(s) protocols', async () => {
    await expect(assertPublicUrl('file:///etc/passwd')).rejects.toThrow(/http/)
    await expect(assertPublicUrl('ftp://example.com')).rejects.toThrow(/http/)
  })
  it('rejects local hostnames before any DNS lookup', async () => {
    await expect(assertPublicUrl('http://localhost/x')).rejects.toThrow(/local/)
    await expect(assertPublicUrl('http://db.internal/x')).rejects.toThrow(/local/)
  })
  it('rejects an IP literal in a private range', async () => {
    await expect(assertPublicUrl('http://169.254.169.254/latest/meta-data')).rejects.toThrow(/private|reserved/)
    await expect(assertPublicUrl('http://127.0.0.1:8080/')).rejects.toThrow(/private|reserved/)
  })
  it('rejects a malformed URL', async () => {
    await expect(assertPublicUrl('not a url')).rejects.toThrow(/Invalid/)
  })
})

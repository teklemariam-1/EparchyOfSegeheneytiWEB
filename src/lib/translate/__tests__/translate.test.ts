import { describe, it, expect, vi, afterEach } from 'vitest'
import { getTranslationProvider, googleTranslateProvider, isGeezText } from '../index'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('isGeezText', () => {
  it('is false for English text', () => {
    expect(isGeezText('Pope Leo visits Montecassino Abbey')).toBe(false)
  })

  it('is true for Tigrinya text', () => {
    expect(isGeezText('ቅዱስ ኣቦ ናብ ኤርትራ መልእኽቲ ሰዲዶም')).toBe(true)
  })

  it('is true for Tigrinya with embedded Latin names and numerals', () => {
    expect(isGeezText('ር.ሊ.ጳ ሌዎ 14 ኣብ Montecassino ጸሎት ኣዕሪጎም')).toBe(true)
  })

  it('is false for empty or symbol-only text', () => {
    expect(isGeezText('')).toBe(false)
    expect(isGeezText('12345 — !')).toBe(false)
  })
})

describe('getTranslationProvider', () => {
  it('returns null when no API key is configured', () => {
    vi.stubEnv('GOOGLE_TRANSLATE_API_KEY', '')
    expect(getTranslationProvider()).toBeNull()
  })

  it('returns the Google provider when the key is set', () => {
    vi.stubEnv('GOOGLE_TRANSLATE_API_KEY', 'test-key')
    expect(getTranslationProvider()?.name).toBe('google')
  })
})

describe('googleTranslateProvider', () => {
  const ok = (translations: Array<{ translatedText: string }>) =>
    ({ ok: true, status: 200, json: async () => ({ data: { translations } }) }) as Response

  it('translates a batch in order and decodes HTML entities', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      ok([{ translatedText: 'ቅዱስ &#39;ኣቦ&#39;' }, { translatedText: 'መልእኽቲ' }]),
    )
    vi.stubGlobal('fetch', fetchMock)

    const out = await googleTranslateProvider('k').translate(['Holy Father', 'Message'], {
      from: 'en',
      to: 'ti',
    })
    expect(out).toEqual(["ቅዱስ 'ኣቦ'", 'መልእኽቲ'])

    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toContain('key=k')
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({
      q: ['Holy Father', 'Message'],
      source: 'en',
      target: 'ti',
      format: 'text',
    })
  })

  it('throws on a non-OK response without echoing the body', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 403 } as Response))
    await expect(
      googleTranslateProvider('k').translate(['x'], { from: 'en', to: 'ti' }),
    ).rejects.toThrow('403')
  })

  it('throws when the result is incomplete', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(ok([{ translatedText: '' }])))
    await expect(
      googleTranslateProvider('k').translate(['x'], { from: 'en', to: 'ti' }),
    ).rejects.toThrow('incomplete')
  })

  it('returns [] for an empty batch without calling the API', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    expect(await googleTranslateProvider('k').translate([], { from: 'en', to: 'ti' })).toEqual([])
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

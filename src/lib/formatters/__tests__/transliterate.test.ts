import { describe, expect, it } from 'vitest'
import { transliterateGeez, slugifyGeez } from '../transliterate'

describe('transliterateGeez', () => {
  it('romanizes a full clergy name readably', () => {
    expect(transliterateGeez('ዑቕባገብርኤል ቀሺ ወልደማርያም')).toBe('uqbagebriel qeshi weldemaryam')
  })

  it('passes Latin text and digits through untouched', () => {
    expect(transliterateGeez('abc 123')).toBe('abc 123')
  })

  it('turns Ethiopic punctuation into word boundaries', () => {
    expect(transliterateGeez('ሰላም።ደሓን')).toBe('selam dehan')
  })
})

describe('slugifyGeez', () => {
  it('produces a URL slug from a Ge’ez-script name', () => {
    expect(slugifyGeez('ዑቕባገብርኤል ቀሺ ወልደማርያም')).toBe('uqbagebriel-qeshi-weldemaryam')
  })

  it('still slugs plain Latin input like the base slugify', () => {
    expect(slugifyGeez('Hello World')).toBe('hello-world')
  })
})

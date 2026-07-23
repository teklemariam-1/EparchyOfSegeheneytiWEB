import { describe, it, expect } from 'vitest'
import { readingTimeFromLexical } from '../reading-time'

const lexical = (text: string) => ({
  root: { children: [{ type: 'paragraph', children: [{ type: 'text', text }] }] },
})

describe('readingTimeFromLexical', () => {
  it('returns null for missing or empty content', () => {
    expect(readingTimeFromLexical(null)).toBeNull()
    expect(readingTimeFromLexical(undefined)).toBeNull()
    expect(readingTimeFromLexical({})).toBeNull()
    expect(readingTimeFromLexical(lexical(''))).toBeNull()
  })

  it('rounds to at least one minute', () => {
    expect(readingTimeFromLexical(lexical('a few short words here'))).toBe(1)
  })

  it('estimates ~200 words per minute', () => {
    expect(readingTimeFromLexical(lexical(Array(600).fill('word').join(' ')))).toBe(3)
    expect(readingTimeFromLexical(lexical(Array(1000).fill('word').join(' ')))).toBe(5)
  })

  it('collects text from nested nodes', () => {
    const nested = {
      root: {
        children: [
          { type: 'heading', children: [{ type: 'text', text: Array(100).fill('w').join(' ') }] },
          {
            type: 'list',
            children: [
              { type: 'listitem', children: [{ type: 'text', text: Array(300).fill('w').join(' ') }] },
            ],
          },
        ],
      },
    }
    expect(readingTimeFromLexical(nested)).toBe(2)
  })
})

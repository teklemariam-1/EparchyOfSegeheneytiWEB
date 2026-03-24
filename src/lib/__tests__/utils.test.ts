import { describe, it, expect } from 'vitest'
import { cn } from '../utils'

describe('cn', () => {
  it('joins multiple class name strings', () => {
    expect(cn('text-sm', 'font-bold')).toBe('text-sm font-bold')
  })

  it('resolves Tailwind conflicts — last value wins', () => {
    expect(cn('text-sm', 'text-lg')).toBe('text-lg')
    expect(cn('p-4', 'p-2')).toBe('p-2')
  })

  it('filters out falsy values', () => {
    expect(cn('text-sm', false && 'hidden', null, undefined)).toBe('text-sm')
  })

  it('handles conditional classes via &&', () => {
    const active = true
    const disabled = false
    expect(cn('base', active && 'active', disabled && 'disabled')).toBe('base active')
  })

  it('handles conditional classes via object syntax (clsx)', () => {
    expect(cn({ 'font-bold': true, italic: false })).toBe('font-bold')
  })

  it('handles an array of classes', () => {
    expect(cn(['text-sm', 'font-medium'])).toBe('text-sm font-medium')
  })

  it('returns empty string when no valid inputs', () => {
    expect(cn(false, null, undefined)).toBe('')
  })
})

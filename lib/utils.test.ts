import { cn } from './utils'

describe('cn utility', () => {
  it('merges basic class names (clsx behavior)', () => {
    // Tests how clsx combines strings, including duplicates if not conflicting Tailwind classes
    expect(cn('a', 'b', 'a')).toBe('a b a')
  })

  it('merges conflicting Tailwind classes correctly (tailwind-merge behavior)', () => {
    // Tests tailwind-merge overriding previous conflicting classes
    expect(cn('p-2', 'p-4')).toBe('p-4')
    expect(cn('bg-red-500', 'p-4', 'bg-blue-500')).toBe('p-4 bg-blue-500')
  })

  it('handles responsive and state modifiers', () => {
    expect(cn('p-2', 'sm:p-4', 'hover:p-6')).toBe('p-2 sm:p-4 hover:p-6')
    expect(cn('hover:bg-red-500', 'hover:bg-blue-500')).toBe('hover:bg-blue-500')
  })

  it('handles falsy values gracefully', () => {
    expect(cn('text-sm', undefined, false, null, '', 'font-bold')).toBe('text-sm font-bold')
    expect(cn(null, false, 'bar', undefined, 0, 1, { baz: null }, '')).toBe('bar 1')
  })

  it('handles conditional classes via objects', () => {
    const hasError = true
    const isDisabled = false
    expect(cn('base', { 'text-red-500': hasError, 'opacity-50': isDisabled })).toBe('base text-red-500')
    expect(cn('base', { 'text-red-500': false, 'opacity-50': true })).toBe('base opacity-50')
  })

  it('handles arrays of class names', () => {
    // tailwind-merge merges arrays and concatenates non-conflicting classes
    expect(cn(['a', 'b'], ['c', 'a'])).toBe('a b c a')
    expect(cn('p-2', ['sm:p-4', 'hover:p-6'], 'p-4')).toBe('sm:p-4 hover:p-6 p-4')
  })

  it('handles mixed arguments (strings, objects, arrays, falsy)', () => {
    const isActive = true
    expect(cn(
      'base',
      false,
      ['p-2', { 'text-green-500': isActive }],
      undefined,
      'sm:p-4',
      { 'font-bold': true, 'text-green-500': false }, // 'text-green-500' from object is overridden
      'p-4' // Overrides 'p-2'
    )).toBe('base text-green-500 sm:p-4 font-bold p-4')
  })

  it('handles empty and only falsy inputs', () => {
    expect(cn()).toBe('')
    expect(cn(null, undefined, false)).toBe('')
  })
})
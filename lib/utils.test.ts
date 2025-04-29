import { cn } from './utils'

describe('cn utility', () => {
  it('merges and deduplicates class names', () => {
    expect(cn('a', 'b', 'a')).toBe('a b')
  })
  it('merges Tailwind classes correctly', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })
  it('handles falsy values gracefully', () => {
    expect(cn('text-sm', undefined, false, 'font-bold')).toBe('text-sm font-bold')
  })
})
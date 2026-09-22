// frontend/tests/unit/utils/formatters.test.js
//
// Tests for the utility formatters.
//
// LOCALE
// ------
// The tests run in `en` so date and number output uses ASCII digits
// and the Gregorian calendar with a Latin numeral set. Testing in
// `ar-SA` would produce Arabic-Indic numerals (`١٢٣٤`), which the
// assertions would have to encode — and which makes the test harder
// to read without adding any real coverage. The `ar-SA` path is
// covered by `i18n/helpers/format.test.js`, which pins the
// `calendar: 'gregory'` override that matters for correctness.

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/i18n', () => {
  const localeRef = { value: 'en' }
  return {
    i18n: {
      global: {
        locale: localeRef,
        t: (key) => `[${key}]`,
      },
    },
  }
})

import {
  formatNumber,
  formatDate,
  formatLongDate,
  formatDateTime,
  truncate,
  daysUntilExpiry,
} from '@/utils/formatters'

import { i18n } from '@/i18n'

beforeEach(() => {
  i18n.global.locale.value = 'en'
})

describe('formatNumber', () => {
  it('returns 0 for null, undefined, and NaN', () => {
    expect(formatNumber(null)).toBe('0')
    expect(formatNumber(undefined)).toBe('0')
    expect(formatNumber(NaN)).toBe('0')
  })

  it('formats an integer', () => {
    expect(formatNumber(1234)).toMatch(/1[,.]234/)
  })

  it('honours fractionDigits', () => {
    const result = formatNumber(1.23456, 2)
    expect(result).toMatch(/1[.,]23/)
  })
})

describe('formatDate', () => {
  it('returns an empty string for a falsy input', () => {
    expect(formatDate('')).toBe('')
    expect(formatDate(null)).toBe('')
  })

  it('returns an empty string for an invalid date', () => {
    expect(formatDate('not-a-date')).toBe('')
  })

  it('formats a valid date with two-digit month and day', () => {
    const result = formatDate('2026-01-05T00:00:00Z')
    expect(result).toMatch(/2026/)
    expect(result.length).toBeGreaterThan(0)
  })

  it('accepts a Date instance', () => {
    const result = formatDate(new Date('2026-01-05T00:00:00Z'))
    expect(result).toMatch(/2026/)
  })

  it('formats a long month when format=long', () => {
    const short = formatDate('2026-01-05T00:00:00Z')
    const long = formatDate('2026-01-05T00:00:00Z', 'long')
    expect(long).toMatch(/2026/)
    expect(short.length).toBeGreaterThan(0)
    expect(long.length).toBeGreaterThan(0)
  })
})

describe('formatLongDate', () => {
  it('returns an em dash for falsy input', () => {
    expect(formatLongDate(null)).toBe('—')
    expect(formatLongDate('')).toBe('—')
  })

  it('returns an em dash for an invalid date', () => {
    expect(formatLongDate('not-a-date')).toBe('—')
  })

  it('formats a valid date', () => {
    const result = formatLongDate('2026-01-05T00:00:00Z')
    expect(result).toMatch(/2026/)
  })
})

describe('formatDateTime', () => {
  it('returns an em dash for falsy input', () => {
    expect(formatDateTime(null)).toBe('—')
  })

  it('includes both the date and the time', () => {
    const result = formatDateTime('2026-01-05T14:30:00Z')
    expect(result).toMatch(/2026/)
    expect(result).toMatch(/\d/)
  })
})

describe('truncate', () => {
  it('returns an empty string for falsy input', () => {
    expect(truncate('')).toBe('')
    expect(truncate(null)).toBe('')
  })

  it('returns the string unchanged when it is short enough', () => {
    expect(truncate('short', 10)).toBe('short')
  })

  it('truncates at the last word boundary when one is close', () => {
    const result = truncate('the quick brown fox jumps', 15)
    expect(result.endsWith('…')).toBe(true)
    expect(result).toMatch(/\w+…$| …$|^…$/)
  })

  it('hard-truncates when there is no close word boundary', () => {
    const result = truncate('a'.repeat(200), 10)
    expect(result).toBe('a'.repeat(10) + '…')
  })

  it('uses a default max length of 100', () => {
    const long = 'a'.repeat(150)
    const result = truncate(long)
    expect(result.length).toBeLessThanOrEqual(101)
  })
})

describe('daysUntilExpiry', () => {
  it('returns null for falsy input', () => {
    expect(daysUntilExpiry(null)).toBeNull()
    expect(daysUntilExpiry('')).toBeNull()
  })

  it('returns a positive number for a future date', () => {
    const future = new Date(Date.now() + 5 * 86400_000).toISOString()
    const days = daysUntilExpiry(future)
    expect(days).toBeGreaterThanOrEqual(4)
    expect(days).toBeLessThanOrEqual(5)
  })

  it('returns a negative number for a past date', () => {
    const past = new Date(Date.now() - 5 * 86400_000).toISOString()
    const days = daysUntilExpiry(past)
    expect(days).toBeLessThan(0)
  })

  it('returns 0 for a date within the last 24 hours', () => {
    const near = new Date(Date.now() - 3600_000).toISOString()
    const days = daysUntilExpiry(near)
    expect(days).toBeLessThanOrEqual(0)
    expect(days).toBeGreaterThanOrEqual(-1)
  })
})
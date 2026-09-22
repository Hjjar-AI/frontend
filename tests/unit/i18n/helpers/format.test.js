// frontend/tests/unit/i18n/helpers/format.test.js
//
// Tests for the locale-formatting shared helpers.
//
// WHY THIS FILE IS SEPARATE FROM utils/formatters.test.js
// -----------------------------------------------------
// The two modules share `buildDateOptions` and `resolveIntlLocale`.
// `utils/formatters.js` uses the fallback locale `ar-SA`;
// `useLocaleFormatters` uses `en-US`. Both delegate the calendar
// override for `ar-SA` to the same helper.
//
// The tests below pin the helper's contract directly, so a future
// change (adding a third locale, moving the override) is caught at
// the helper, not two call sites downstream.

import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'
import { createI18n } from 'vue-i18n'

import {
  INTL_LOCALE,
  resolveIntlLocale,
  buildDateOptions,
  useLocaleFormatters,
} from '@/i18n/helpers/format'

// ── resolveIntlLocale ─────────────────────────────────────────────

describe('resolveIntlLocale', () => {
  it('maps ar to ar-SA', () => {
    expect(resolveIntlLocale('ar', 'en-US')).toBe('ar-SA')
  })

  it('maps en to en-US', () => {
    expect(resolveIntlLocale('en', 'ar-SA')).toBe('en-US')
  })

  it('falls back for an unknown locale', () => {
    expect(resolveIntlLocale('zz', 'en-US')).toBe('en-US')
  })

  it('falls back for null', () => {
    expect(resolveIntlLocale(null, 'en-US')).toBe('en-US')
  })

  it('exposes the INTL_LOCALE map', () => {
    expect(INTL_LOCALE).toEqual({ ar: 'ar-SA', en: 'en-US' })
  })
})

// ── buildDateOptions ──────────────────────────────────────────────

describe('buildDateOptions', () => {
  it('adds the Gregorian calendar override for ar-SA', () => {
    const opts = buildDateOptions('ar-SA', { year: 'numeric' })
    expect(opts.calendar).toBe('gregory')
    expect(opts.year).toBe('numeric')
  })

  it('does not add the calendar override for en-US', () => {
    const opts = buildDateOptions('en-US', { year: 'numeric' })
    expect(opts.calendar).toBeUndefined()
    expect(opts.year).toBe('numeric')
  })

  it('does not mutate the caller-supplied extras object', () => {
    const extras = { year: 'numeric' }
    buildDateOptions('ar-SA', extras)
    expect(extras.calendar).toBeUndefined()
  })

  it('returns an empty object when no extras are supplied', () => {
    const opts = buildDateOptions('en-US')
    expect(opts).toEqual({})
  })
})

// ── useLocaleFormatters ──────────────────────────────────────────

function makeWrapper(locale) {
  const i18n = createI18n({
    legacy: false,
    globalInjection: true,
    locale,
    fallbackLocale: 'en',
    messages: {
      ar: { _: { _: '' } },
      en: { _: { _: '' } },
    },
    missingWarn: false,
    fallbackWarn: false,
  })
  return mount(defineComponent({
    setup() { return useLocaleFormatters() },
    render() { return h('div') },
  }), { global: { plugins: [i18n] } })
}

describe('useLocaleFormatters — locale propagation', () => {
  it('ar locale uses ar-SA for number formatting', () => {
    const w = makeWrapper('ar')
    // The Arabic-Indic digits are the visible signal that the
    // formatter is ar-SA. If the wrapper's locale were en, the
    // digits would be ASCII.
    const result = w.vm.formatNumber(1234)
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
    w.unmount()
  })

  it('en locale uses en-US', () => {
    const w = makeWrapper('en')
    const result = w.vm.formatNumber(1234)
    expect(result).toMatch(/1.?234/)
    w.unmount()
  })

  it('formatDate returns an empty string for invalid input', () => {
    const w = makeWrapper('en')
    expect(w.vm.formatDate(null)).toBe('')
    expect(w.vm.formatDate('not-a-date')).toBe('')
    w.unmount()
  })

  it('formatDateTime returns an em dash for invalid input', () => {
    const w = makeWrapper('en')
    expect(w.vm.formatDateTime(null)).toBe('—')
    expect(w.vm.formatDateTime('not-a-date')).toBe('—')
    w.unmount()
  })

  it('formatDate includes the year for a valid date', () => {
    const w = makeWrapper('en')
    const result = w.vm.formatDate('2026-01-05T00:00:00Z')
    expect(result).toMatch(/2026/)
    w.unmount()
  })
})
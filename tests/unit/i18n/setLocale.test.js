// frontend/tests/unit/i18n/setLocale.test.js
//
// Tests for the single writer of the active locale.
//
// `setLocale` is the sole owner of the `localStorage['locale']` key
// and the sole writer of `<html lang|dir|data-locale>`. The
// preferencesStore deliberately does NOT write that key. This file
// pins the three side effects.

import { describe, it, expect, beforeEach, vi } from 'vitest'

import { i18n, setLocale } from '@/i18n'
import { applyLocaleToDOM } from '@/i18n/helpers/direction'

const dispatchSpy = vi.spyOn(window, 'dispatchEvent')

beforeEach(() => {
  localStorage.clear()
  i18n.global.locale.value = 'ar'
  applyLocaleToDOM('ar')

  dispatchSpy.mockClear()
})

describe('setLocale', () => {
  it('updates the i18n locale ref', () => {
    setLocale('en')
    expect(i18n.global.locale.value).toBe('en')
  })

  it('writes localStorage["locale"]', () => {
    setLocale('en')
    expect(localStorage.getItem('locale')).toBe('en')
  })

  it('updates <html lang>', () => {
    setLocale('en')
    expect(document.documentElement.getAttribute('lang')).toBe('en')
  })

  it('updates <html dir>', () => {
    setLocale('en')
    expect(document.documentElement.getAttribute('dir')).toBe('ltr')
    setLocale('ar')
    expect(document.documentElement.getAttribute('dir')).toBe('rtl')
  })

  it('updates <html data-locale>', () => {
    setLocale('en')
    expect(document.documentElement.getAttribute('data-locale')).toBe('en')
  })

  it('dispatches an app:locale-changed event', () => {
    setLocale('en')
    const events = dispatchSpy.mock.calls
      .map(([e]) => e)
      .filter((e) => e instanceof CustomEvent && e.type === 'app:locale-changed')
    expect(events.length).toBeGreaterThan(0)
    expect(events[0].detail).toEqual({ locale: 'en', dir: 'ltr' })
  })

  it('rejects an unsupported locale and keeps the current one', () => {
    setLocale('en')
    const result = setLocale('zz')
    expect(result).toBe('en')
    expect(i18n.global.locale.value).toBe('en')
  })

  it('re-applies the DOM to the current locale on a repeated call', () => {
    setLocale('en')
    dispatchSpy.mockClear()
    setLocale('en')
    expect(document.documentElement.getAttribute('lang')).toBe('en')
  })

  it('returns the applied locale', () => {
    expect(setLocale('en')).toBe('en')
    expect(setLocale('ar')).toBe('ar')
  })
})
// frontend/tests/unit/composables/useTheme.test.js
//
// i18n note: `useTheme.applyTheme` calls `i18n.global.t(...)` to
// announce the theme change via the a11y live region. The i18n
// singleton is initialized by `@/i18n` when the module is imported,
// and the test does not need to install the plugin on a Vue app.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useTheme, applyTheme, loadSavedTheme } from '@/composables/useTheme'
import { storageService } from '@/services/storageService'

beforeEach(() => {
  vi.useFakeTimers()
  localStorage.clear()
  // Reset the DOM to a known baseline. `loadSavedTheme` with an
  // empty storage defaults `currentTheme` to 'light' and writes
  // `data-theme="light"` on the html element.
  loadSavedTheme()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useTheme — applyTheme', () => {
  it('updates currentTheme and the data-theme attribute', () => {
    const { currentTheme } = useTheme()
    applyTheme('dark')
    expect(currentTheme.value).toBe('dark')
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  it('persists the choice to localStorage', () => {
    applyTheme('blossom')
    expect(storageService.getItem('theme')).toBe('blossom')
  })

  it('falls back to light for an unknown theme', () => {
    const { currentTheme } = useTheme()
    applyTheme('not-a-real-theme')
    expect(currentTheme.value).toBe('light')
  })

  it('adds then removes the theme-transition class', () => {
    applyTheme('dark')
    expect(document.documentElement.classList.contains('theme-transition')).toBe(true)
    vi.advanceTimersByTime(350)
    expect(document.documentElement.classList.contains('theme-transition')).toBe(false)
  })

  it('is a no-op when applying the current theme again', () => {
    applyTheme('dark')
    document.documentElement.classList.remove('theme-transition')
    applyTheme('dark')
    // The transition class is not re-added when the theme did not
    // change.
    expect(document.documentElement.classList.contains('theme-transition')).toBe(false)
  })
})

describe('useTheme — loadSavedTheme', () => {
  it('restores the theme from localStorage', () => {
    storageService.setItem('theme', 'fresh')
    const { currentTheme } = useTheme()
    loadSavedTheme()
    expect(currentTheme.value).toBe('fresh')
    expect(document.documentElement.getAttribute('data-theme')).toBe('fresh')
  })

  it('falls back to light when the stored value is not a known theme', () => {
    storageService.setItem('theme', 'pink')
    const { currentTheme } = useTheme()
    loadSavedTheme()
    expect(currentTheme.value).toBe('light')
  })

  it('falls back to light when storage is empty', () => {
    const { currentTheme } = useTheme()
    loadSavedTheme()
    expect(currentTheme.value).toBe('light')
  })
})

describe('useTheme — getters', () => {
  it('isDark is true only for the dark theme', () => {
    const { isDark } = useTheme()
    applyTheme('dark')
    expect(isDark.value).toBe(true)
    applyTheme('light')
    expect(isDark.value).toBe(false)
    applyTheme('fresh')
    expect(isDark.value).toBe(false)
  })

  it('THEMES exposes the four supported themes', () => {
    const { THEMES } = useTheme()
    expect([...THEMES].sort()).toEqual(['blossom', 'dark', 'fresh', 'light'])
  })
})
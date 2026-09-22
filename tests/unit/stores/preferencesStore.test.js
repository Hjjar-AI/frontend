// frontend/tests/unit/stores/preferencesStore.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { usePreferencesStore } from '@/stores/preferencesStore'
import { storageService } from '@/services/storageService'

beforeEach(() => {
  setActivePinia(createPinia())
  // localStorage in happy-dom is per-test-file, so clearing here is
  // enough to isolate tests.
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('preferencesStore — load', () => {
  it('uses the defaults when storage is empty', () => {
    const store = usePreferencesStore()
    store.load()
    expect(store.defaultPerPage).toBe(20)
    expect(store.defaultDifficulty).toBe('')
    expect(store.autoAdvance).toBe(false)
    expect(store.soundEffects).toBe(true)
  })

  it('reads a valid perPage override from storage', () => {
    storageService.setItem('pref_perPage', '50')
    const store = usePreferencesStore()
    store.load()
    expect(store.defaultPerPage).toBe(50)
  })

  it('falls back to 20 when the stored perPage is not on the whitelist', () => {
    storageService.setItem('pref_perPage', '37')
    const store = usePreferencesStore()
    store.load()
    expect(store.defaultPerPage).toBe(20)
  })

  it('reads a valid difficulty override', () => {
    storageService.setItem('pref_difficulty', 'hard')
    const store = usePreferencesStore()
    store.load()
    expect(store.defaultDifficulty).toBe('hard')
  })

  it('rejects an unknown difficulty value', () => {
    storageService.setItem('pref_difficulty', 'insane')
    const store = usePreferencesStore()
    store.load()
    expect(store.defaultDifficulty).toBe('')
  })

  it('reads boolean preferences from their string form', () => {
    storageService.setItem('pref_autoAdvance', 'true')
    storageService.setItem('pref_sound', 'false')
    const store = usePreferencesStore()
    store.load()
    expect(store.autoAdvance).toBe(true)
    expect(store.soundEffects).toBe(false)
  })
})

describe('preferencesStore — update', () => {
  it('accepts a valid perPage and persists the string form', () => {
    const store = usePreferencesStore()
    store.update('defaultPerPage', 100)
    expect(store.defaultPerPage).toBe(100)
    expect(storageService.getItem('pref_perPage')).toBe('100')
  })

  it('clamps an invalid perPage back to the default and stores it', () => {
    const store = usePreferencesStore()
    store.update('defaultPerPage', 999)
    expect(store.defaultPerPage).toBe(20)
    expect(storageService.getItem('pref_perPage')).toBe('20')
  })

  it('coerces booleans', () => {
    const store = usePreferencesStore()
    store.update('autoAdvance', 1)
    expect(store.autoAdvance).toBe(true)
    store.update('soundEffects', 0)
    expect(store.soundEffects).toBe(false)
  })

  it('does not write a storage key for the locale preference', () => {
    const store = usePreferencesStore()
    const spy = vi.spyOn(storageService, 'setItem')
    store.update('locale', 'en')
    // The store is not the writer for `locale` — see i18n/index.js.
    expect(spy).not.toHaveBeenCalledWith('locale', expect.anything())
  })
})

describe('preferencesStore — reset', () => {
  it('restores defaults and removes every pref_ storage key', () => {
    const store = usePreferencesStore()
    store.update('defaultPerPage', 50)
    store.update('defaultDifficulty', 'hard')
    store.update('autoAdvance', true)
    store.update('soundEffects', false)

    store.reset()

    expect(store.defaultPerPage).toBe(20)
    expect(store.defaultDifficulty).toBe('')
    expect(store.autoAdvance).toBe(false)
    expect(store.soundEffects).toBe(true)
    expect(storageService.getItem('pref_perPage')).toBeNull()
    expect(storageService.getItem('pref_difficulty')).toBeNull()
    expect(storageService.getItem('pref_autoAdvance')).toBeNull()
    expect(storageService.getItem('pref_sound')).toBeNull()
  })

  it('does not clear the locale key on reset', () => {
    localStorage.setItem('locale', 'en')
    const store = usePreferencesStore()
    store.reset()
    expect(localStorage.getItem('locale')).toBe('en')
  })
})
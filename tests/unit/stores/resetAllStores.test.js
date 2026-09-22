// frontend/tests/unit/stores/resetAllStores.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { resetAllStores } from '@/stores/resetAllStores'
import { useAuthStore } from '@/stores/authStore'
import { useQuestionStore } from '@/stores/questionStore'
import { useBookmarkStore } from '@/stores/bookmarkStore'
import { clearCrudCache } from '@/composables/useCrudActions'

beforeEach(() => {
  setActivePinia(createPinia())
  localStorage.clear()
  sessionStorage.clear()
  clearCrudCache()
})

describe('resetAllStores — localStorage clear list', () => {
  it('clears last_viewed_question_id_* keys', () => {
    localStorage.setItem('last_viewed_question_id_1', '42')
    localStorage.setItem('last_viewed_question_id_2', '99')
    resetAllStores()
    expect(localStorage.getItem('last_viewed_question_id_1')).toBeNull()
    expect(localStorage.getItem('last_viewed_question_id_2')).toBeNull()
  })

  it('clears recent_* keys', () => {
    localStorage.setItem('recent_1_categories', '[1,2]')
    localStorage.setItem('recent_2_tags', '["a"]')
    resetAllStores()
    expect(localStorage.getItem('recent_1_categories')).toBeNull()
    expect(localStorage.getItem('recent_2_tags')).toBeNull()
  })

  it('clears pref_* user preference overrides', () => {
    localStorage.setItem('pref_perPage', '50')
    localStorage.setItem('pref_difficulty', 'hard')
    localStorage.setItem('pref_autoAdvance', 'true')
    localStorage.setItem('pref_sound', 'false')
    resetAllStores()
    expect(localStorage.getItem('pref_perPage')).toBeNull()
    expect(localStorage.getItem('pref_difficulty')).toBeNull()
    expect(localStorage.getItem('pref_autoAdvance')).toBeNull()
    expect(localStorage.getItem('pref_sound')).toBeNull()
  })
})

describe('resetAllStores — device-scoped preferences survive', () => {
  it('preserves the locale key', () => {
    localStorage.setItem('locale', 'en')
    resetAllStores()
    expect(localStorage.getItem('locale')).toBe('en')
  })

  it('preserves the theme key', () => {
    localStorage.setItem('theme', 'dark')
    resetAllStores()
    expect(localStorage.getItem('theme')).toBe('dark')
  })

  it('does not touch the data-theme attribute on the html element', () => {
    document.documentElement.setAttribute('data-theme', 'blossom')
    resetAllStores()
    expect(document.documentElement.getAttribute('data-theme')).toBe('blossom')
  })
})

describe('resetAllStores — sessionStorage', () => {
  it('clears the legacy test_session_mode and test_session_id keys', () => {
    sessionStorage.setItem('test_session_mode', 'exam')
    sessionStorage.setItem('test_session_id', 'sess-1')
    resetAllStores()
    expect(sessionStorage.getItem('test_session_mode')).toBeNull()
    expect(sessionStorage.getItem('test_session_id')).toBeNull()
  })

  it('clears per-mode test_session_* keys', () => {
    sessionStorage.setItem('test_session_mode_exam', 'exam')
    sessionStorage.setItem('test_session_id_exam', 'sess-2')
    sessionStorage.setItem('test_session_id_study', 'sess-3')
    resetAllStores()
    expect(sessionStorage.getItem('test_session_mode_exam')).toBeNull()
    expect(sessionStorage.getItem('test_session_id_exam')).toBeNull()
    expect(sessionStorage.getItem('test_session_id_study')).toBeNull()
  })

  it('preserves unrelated sessionStorage keys', () => {
    sessionStorage.setItem('unrelated', 'survive-me')
    resetAllStores()
    expect(sessionStorage.getItem('unrelated')).toBe('survive-me')
  })
})

describe('resetAllStores — CRUD cache', () => {
  it('clears the module-level cache', async () => {
    const { useCrudActions } = await import('@/composables/useCrudActions')
    const store = { status: 'idle', error: null }
    const { wrap } = useCrudActions(store)
    const cb = vi.fn(async () => ({ id: 1 }))
    await wrap(cb, { cacheKey: 'k1' })
    await wrap(cb, { cacheKey: 'k1' })
    expect(cb).toHaveBeenCalledTimes(1)

    resetAllStores()

    await wrap(cb, { cacheKey: 'k1' })
    expect(cb).toHaveBeenCalledTimes(2)
  })
})

describe('resetAllStores — Pinia stores', () => {
  it('resets authStore.user to null', () => {
    const authStore = useAuthStore()
    authStore.user = { id: 1, capabilities: [] }
    resetAllStores()
    expect(authStore.user).toBeNull()
  })

  it('resets questionStore.ids to empty', () => {
    const questionStore = useQuestionStore()
    questionStore.ids = [1, 2, 3]
    questionStore.byId = { 1: {}, 2: {}, 3: {} }
    resetAllStores()
    expect(questionStore.ids).toEqual([])
    expect(questionStore.byId).toEqual({})
  })

  it('resets bookmarkStore.bookmarkedIds to empty', () => {
    const bookmarkStore = useBookmarkStore()
    bookmarkStore.bookmarkedIds = [1, 2]
    bookmarkStore.count = 2
    resetAllStores()
    expect(bookmarkStore.bookmarkedIds).toEqual([])
    expect(bookmarkStore.count).toBe(0)
  })

  it('does not throw when the store registry is empty', () => {
    // A fresh pinia with no instantiated stores. `resetAllStores`
    // iterates whatever state exists and is a no-op when there is
    // nothing to reset.
    expect(() => resetAllStores()).not.toThrow()
  })
})

describe('resetAllStores — idempotence', () => {
  it('running twice is a no-op the second time', () => {
    localStorage.setItem('pref_perPage', '50')
    resetAllStores()
    expect(() => resetAllStores()).not.toThrow()
    expect(localStorage.getItem('pref_perPage')).toBeNull()
  })
})
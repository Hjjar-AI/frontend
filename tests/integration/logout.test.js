// frontend/tests/integration/logout.test.js
//
// Integration test for the logout flow.
//
// WHAT THIS EXERCISES
// -------------------
// The logout path spans four modules:
//
//   • `authStore.logout()` — clears the user, calls `resetAllStores`,
//     clears the CSRF token, fires the notify toast.
//   • `resetAllStores` — clears user-scoped localStorage keys,
//     sessionStorage test-session keys, and every Pinia store that
//     exposes `reset()`. It preserves `theme` and `locale`.
//   • `clearCsrfToken` — resets the module-level CSRF store.
//   • `useNotify` — emits the sign-out toast.
//
// Every one of those modules has its own unit test. What none of
// them has is a test that drives them together, which is exactly
// what a logout click does. This file asserts the composite
// behaviour: after a logout, the app is in a clean user-scoped
// state and the device-scoped preferences survive.

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/services/authService', () => ({
  authService: {
    logout: vi.fn().mockResolvedValue({}),
  },
}))

import { authService } from '@/services/authService'
import { useAuthStore } from '@/stores/authStore'
import { useQuestionStore } from '@/stores/questionStore'
import { useBookmarkStore } from '@/stores/bookmarkStore'
import { usePreferencesStore } from '@/stores/preferencesStore'
import { storageService } from '@/services/storageService'
import { getCsrfToken, setCsrfToken } from '@/services/api/csrfTokenStore'

beforeEach(() => {
  setActivePinia(createPinia())
  localStorage.clear()
  sessionStorage.clear()
  vi.clearAllMocks()
})

describe('logout — end to end', () => {
  it('clears the user, the stores, and the user-scoped storage keys', async () => {
    // ── Seed the pre-logout state ──────────────────────────────
    const authStore = useAuthStore()
    const questionStore = useQuestionStore()
    const bookmarkStore = useBookmarkStore()

    authStore.user = { id: 7, username: 'alice', capabilities: [] }
    questionStore.ids = [1, 2, 3]
    questionStore.byId = { 1: {}, 2: {}, 3: {} }
    bookmarkStore.bookmarkedIds = [1, 2]
    bookmarkStore.count = 2

    localStorage.setItem('last_viewed_question_id_7', '42')
    localStorage.setItem('recent_7_categories', '[1,2]')
    localStorage.setItem('pref_perPage', '50')
    sessionStorage.setItem('test_session_mode', 'exam')
    sessionStorage.setItem('test_session_id', 'sess-1')

    // Set a CSRF token to prove it is cleared.
    setCsrfToken('csrf-token-before-logout')
    expect(getCsrfToken()).toBe('csrf-token-before-logout')

    // ── Drive the logout ──────────────────────────────────────
    await authStore.logout()

    // ── Post-conditions ───────────────────────────────────────
    // The user is cleared.
    expect(authStore.user).toBeNull()

    // The stores were reset.
    expect(questionStore.ids).toEqual([])
    expect(questionStore.byId).toEqual({})
    expect(bookmarkStore.bookmarkedIds).toEqual([])
    expect(bookmarkStore.count).toBe(0)

    // User-scoped localStorage keys are gone.
    expect(localStorage.getItem('last_viewed_question_id_7')).toBeNull()
    expect(localStorage.getItem('recent_7_categories')).toBeNull()
    expect(localStorage.getItem('pref_perPage')).toBeNull()

    // Session keys are gone.
    expect(sessionStorage.getItem('test_session_mode')).toBeNull()
    expect(sessionStorage.getItem('test_session_id')).toBeNull()

    // The CSRF token is cleared.
    expect(getCsrfToken()).toBeNull()

    // The logout request was sent.
    expect(authService.logout).toHaveBeenCalledTimes(1)
  })

  it('preserves the device-scoped theme and locale', async () => {
    localStorage.setItem('theme', 'blossom')
    localStorage.setItem('locale', 'en')
    document.documentElement.setAttribute('data-theme', 'blossom')
    document.documentElement.setAttribute('lang', 'en')

    const authStore = useAuthStore()
    authStore.user = { id: 7, capabilities: [] }

    await authStore.logout()

    expect(localStorage.getItem('theme')).toBe('blossom')
    expect(localStorage.getItem('locale')).toBe('en')
    expect(document.documentElement.getAttribute('data-theme')).toBe('blossom')
  })

  it('clears the user even when the logout API call fails', async () => {
    authService.logout.mockRejectedValueOnce(new Error('offline'))
    const authStore = useAuthStore()
    const questionStore = useQuestionStore()
    authStore.user = { id: 7, capabilities: [] }
    questionStore.ids = [1, 2]

    // Silence the store's own console.warn for the rejected request.
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      await authStore.logout()
    } finally {
      warnSpy.mockRestore()
    }

    expect(authStore.user).toBeNull()
    expect(questionStore.ids).toEqual([])
  })
})
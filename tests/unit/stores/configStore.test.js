// frontend/tests/unit/stores/configStore.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/services/api/client', () => ({
  apiClient: {
    get: vi.fn(),
  },
}))

import { apiClient } from '@/services/api/client'
import { useConfigStore } from '@/stores/configStore'
import {
  FALLBACK_MAX_CHOICES,
  FALLBACK_ITEMS_PER_PAGE,
  FALLBACK_MAX_QUIZ_QUESTIONS,
} from '@/utils/constants'

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

describe('configStore — initial state', () => {
  it('starts at the fallback constants so the app can render before config loads', () => {
    const store = useConfigStore()
    expect(store.maxChoices).toBe(FALLBACK_MAX_CHOICES)
    expect(store.itemsPerPage).toBe(FALLBACK_ITEMS_PER_PAGE)
    expect(store.maxQuizQuestions).toBe(FALLBACK_MAX_QUIZ_QUESTIONS)
    expect(store.loaded).toBe(false)
  })
})

describe('configStore — fetchConfig (success)', () => {
  it('applies the response and marks loaded', async () => {
    apiClient.get.mockResolvedValueOnce({
      max_quiz_questions: 100,
      max_choices: 6,
      items_per_page: 30,
      roles: { admin: 'admin', moderator: 'moderator', member: 'member' },
    })
    const store = useConfigStore()
    await store.fetchConfig()
    expect(store.maxQuizQuestions).toBe(100)
    expect(store.maxChoices).toBe(6)
    expect(store.itemsPerPage).toBe(30)
    expect(store.loaded).toBe(true)
    expect(store.error).toBeNull()
  })

  it('keeps fallback values for keys the response omits', async () => {
    apiClient.get.mockResolvedValueOnce({})
    const store = useConfigStore()
    await store.fetchConfig()
    expect(store.maxChoices).toBe(FALLBACK_MAX_CHOICES)
    expect(store.itemsPerPage).toBe(FALLBACK_ITEMS_PER_PAGE)
  })

  it('hits the /config/ endpoint', async () => {
    apiClient.get.mockResolvedValueOnce({})
    const store = useConfigStore()
    await store.fetchConfig()
    expect(apiClient.get).toHaveBeenCalledWith('/config/')
  })
})

describe('configStore — fetchConfig (failure)', () => {
  it('marks loaded even on failure so the app does not hang', async () => {
    apiClient.get.mockRejectedValueOnce({ message: 'fail', code: 'NETWORK' })
    const store = useConfigStore()
    await store.fetchConfig()
    expect(store.loaded).toBe(true)
  })

  it('stores a localized error message', async () => {
    apiClient.get.mockRejectedValueOnce({ message: 'offline', code: 'NETWORK' })
    const store = useConfigStore()
    await store.fetchConfig()
    expect(typeof store.error).toBe('string')
    expect(store.error.length).toBeGreaterThan(0)
  })
})

describe('configStore — reset', () => {
  it('returns every field to its default', () => {
    const store = useConfigStore()
    store.maxChoices = 4
    store.loaded = true
    store.error = 'oops'
    store.reset()
    expect(store.maxChoices).toBe(FALLBACK_MAX_CHOICES)
    expect(store.loaded).toBe(false)
    expect(store.error).toBeNull()
  })
})
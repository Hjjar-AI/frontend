// frontend/tests/unit/stores/flagStore.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/services/flagService', () => ({
  flagService: {
    listPendingFlags: vi.fn(),
    resolveFlag: vi.fn(),
    flagQuestion: vi.fn(),
  },
}))

import { flagService } from '@/services/flagService'
import { useFlagStore } from '@/stores/flagStore'

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

describe('flagStore — fetchPending', () => {
  it('populates flags and pagination', async () => {
    flagService.listPendingFlags.mockResolvedValueOnce({
      items: [
        { id: 1, question_id: 10, reason: 'x' },
        { id: 2, question_id: 11, reason: 'y' },
      ],
      page: 1,
      per_page: 50,
      total: 2,
    })
    const store = useFlagStore()
    await store.fetchPending()
    expect(store.flags).toHaveLength(2)
    expect(store.pagination.total).toBe(2)
    expect(store.initialized).toBe(true)
  })

  it('marks initialized even when the list is empty', async () => {
    flagService.listPendingFlags.mockResolvedValueOnce({ items: [], total: 0 })
    const store = useFlagStore()
    await store.fetchPending()
    expect(store.initialized).toBe(true)
  })
})

describe('flagStore — ensureLoaded', () => {
  it('fetches when not yet initialized', async () => {
    flagService.listPendingFlags.mockResolvedValueOnce({ items: [], total: 0 })
    const store = useFlagStore()
    await store.ensureLoaded()
    expect(flagService.listPendingFlags).toHaveBeenCalledTimes(1)
  })

  it('is a no-op after the first successful fetch', async () => {
    flagService.listPendingFlags.mockResolvedValueOnce({ items: [], total: 0 })
    const store = useFlagStore()
    await store.ensureLoaded()
    await store.ensureLoaded()
    expect(flagService.listPendingFlags).toHaveBeenCalledTimes(1)
  })
})

describe('flagStore — resolveFlag', () => {
  it('drops the resolved flag and decrements the total', async () => {
    flagService.resolveFlag.mockResolvedValueOnce({})
    const store = useFlagStore()
    store.flags = [{ id: 1 }, { id: 2 }]
    store.pagination = { page: 1, per_page: 50, total: 2 }
    await store.resolveFlag(1)
    expect(store.flags.map(f => f.id)).toEqual([2])
    expect(store.pagination.total).toBe(1)
  })

  it('does not go negative if the local count was already zero', async () => {
    flagService.resolveFlag.mockResolvedValueOnce({})
    const store = useFlagStore()
    store.flags = []
    store.pagination = { page: 1, per_page: 50, total: 0 }
    await store.resolveFlag(99)
    expect(store.pagination.total).toBe(0)
  })
})

describe('flagStore — flagQuestion', () => {
  it('delegates to the service with the reason', async () => {
    flagService.flagQuestion.mockResolvedValueOnce({})
    const store = useFlagStore()
    await store.flagQuestion(42, 'unclear')
    expect(flagService.flagQuestion).toHaveBeenCalledWith(42, 'unclear')
  })

  it('defaults the reason to an empty string', async () => {
    flagService.flagQuestion.mockResolvedValueOnce({})
    const store = useFlagStore()
    await store.flagQuestion(42)
    expect(flagService.flagQuestion).toHaveBeenCalledWith(42, '')
  })
})

describe('flagStore — pendingCount getter', () => {
  it('reads the pagination total when present', () => {
    const store = useFlagStore()
    store.pagination = { total: 5 }
    store.flags = []
    expect(store.pendingCount).toBe(5)
  })

  it('falls back to the local array length', () => {
    const store = useFlagStore()
    store.pagination = { total: 0 }
    store.flags = [{ id: 1 }, { id: 2 }]
    // `||` short-circuits on 0, so the getter falls through to the
    // local list length.
    expect(store.pendingCount).toBe(2)
  })
})

describe('flagStore — reset', () => {
  it('clears every state field', () => {
    const store = useFlagStore()
    store.flags = [{ id: 1 }]
    store.initialized = true
    store.reset()
    expect(store.flags).toEqual([])
    expect(store.initialized).toBe(false)
  })
})
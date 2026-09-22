// frontend/tests/unit/stores/bookmarkStore.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/services/bookmarkService', () => ({
  bookmarkService: {
    list: vi.fn(),
    toggle: vi.fn(),
    count: vi.fn(),
  },
}))

import { bookmarkService } from '@/services/bookmarkService'
import { useBookmarkStore } from '@/stores/bookmarkStore'

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

describe('bookmarkStore — fetchBookmarks', () => {
  it('populates bookmarkedIds from the response', async () => {
    bookmarkService.list.mockResolvedValueOnce({
      items: [{ id: 1 }, { id: 2 }],
      count: 2,
    })
    const store = useBookmarkStore()
    await store.fetchBookmarks()
    expect(store.bookmarkedIds).toEqual([1, 2])
    expect(store.count).toBe(2)
  })

  it('falls back to items.length when count is missing', async () => {
    bookmarkService.list.mockResolvedValueOnce({ items: [{ id: 1 }] })
    const store = useBookmarkStore()
    await store.fetchBookmarks()
    expect(store.count).toBe(1)
  })
})

describe('bookmarkStore — toggle (optimistic)', () => {
  it('adds optimistically and keeps the entry on success', async () => {
    bookmarkService.toggle.mockResolvedValueOnce({ added: true })
    const store = useBookmarkStore()
    store.bookmarkedIds = []
    store.count = 0
    await store.toggle(42)
    expect(store.bookmarkedIds).toContain(42)
    expect(store.count).toBe(1)
  })

  it('removes optimistically and stays removed on success', async () => {
    bookmarkService.toggle.mockResolvedValueOnce({ added: false })
    const store = useBookmarkStore()
    store.bookmarkedIds = [42]
    store.count = 1
    await store.toggle(42)
    expect(store.bookmarkedIds).not.toContain(42)
    expect(store.count).toBe(0)
  })

  it('reverts the optimistic add when the request fails', async () => {
    bookmarkService.toggle.mockRejectedValueOnce({ message: 'fail' })
    const store = useBookmarkStore()
    store.bookmarkedIds = []
    store.count = 0
    await store.toggle(42)
    expect(store.bookmarkedIds).toEqual([])
    expect(store.count).toBe(0)
  })

  it('reverts the optimistic remove when the request fails', async () => {
    bookmarkService.toggle.mockRejectedValueOnce({ message: 'fail' })
    const store = useBookmarkStore()
    store.bookmarkedIds = [42]
    store.count = 1
    await store.toggle(42)
    expect(store.bookmarkedIds).toContain(42)
    expect(store.count).toBe(1)
  })

  it('collapses concurrent toggles of the same id into one request', async () => {
    // The store keeps a `_pendingToggles` map so two clicks on the
    // same card do not fire two requests.
    let resolve
    bookmarkService.toggle.mockImplementationOnce(
      () => new Promise((r) => { resolve = r }),
    )
    const store = useBookmarkStore()
    const p1 = store.toggle(42)
    const p2 = store.toggle(42)
    resolve({ added: true })
    await Promise.all([p1, p2])
    expect(bookmarkService.toggle).toHaveBeenCalledTimes(1)
  })
})
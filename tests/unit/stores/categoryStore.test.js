// frontend/tests/unit/stores/categoryStore.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/services/categoryService', () => ({
  categoryService: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}))

import { categoryService } from '@/services/categoryService'
import { useCategoryStore } from '@/stores/categoryStore'

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

describe('categoryStore — fetchAll', () => {
  it('normalizes the list into byId + ids', async () => {
    categoryService.list.mockResolvedValueOnce({
      items: [
        { id: 1, name: 'Mood' },
        { id: 2, name: 'Anxiety' },
      ],
      page: 1,
      per_page: 500,
      total: 2,
      total_pages: 1,
    })
    const store = useCategoryStore()
    await store.fetchAll()
    expect(store.ids).toEqual([1, 2])
    expect(store.byId[1]).toEqual({ id: 1, name: 'Mood' })
    expect(store.pagination.total).toBe(2)
  })

  it('requests the server-side max page size', async () => {
    categoryService.list.mockResolvedValueOnce({ items: [] })
    const store = useCategoryStore()
    await store.fetchAll()
    expect(categoryService.list).toHaveBeenCalledWith({ per_page: 500 })
  })

  it('merges new fields into existing rows', async () => {
    categoryService.list.mockResolvedValueOnce({
      items: [{ id: 1, name: 'X', extra: 'y' }],
    })
    const store = useCategoryStore()
    store.byId = { 1: { id: 1, name: 'X' } }
    await store.fetchAll()
    expect(store.byId[1].extra).toBe('y')
  })
})

describe('categoryStore — create', () => {
  it('prepends the new category', async () => {
    categoryService.create.mockResolvedValueOnce({ id: 9, name: 'New' })
    const store = useCategoryStore()
    store.ids = [1, 2]
    await store.create({ name: 'New' })
    expect(store.ids[0]).toBe(9)
    expect(store.byId[9]).toEqual({ id: 9, name: 'New' })
  })
})

describe('categoryStore — update', () => {
  it('replaces the matching row', async () => {
    categoryService.update.mockResolvedValueOnce({ id: 1, name: 'Renamed' })
    const store = useCategoryStore()
    store.byId = { 1: { id: 1, name: 'Old' } }
    await store.update(1, { name: 'Renamed' })
    expect(store.byId[1].name).toBe('Renamed')
  })

  it('updates currentItem when the edited row is the current one', async () => {
    categoryService.update.mockResolvedValueOnce({ id: 1, name: 'Renamed' })
    const store = useCategoryStore()
    store.currentItem = { id: 1, name: 'Old' }
    await store.update(1, { name: 'Renamed' })
    expect(store.currentItem.name).toBe('Renamed')
  })
})

describe('categoryStore — remove', () => {
  it('drops the row from byId and ids', async () => {
    categoryService.delete.mockResolvedValueOnce({})
    const store = useCategoryStore()
    store.byId = { 1: { id: 1 }, 2: { id: 2 } }
    store.ids = [1, 2]
    await store.remove(1)
    expect(store.byId[1]).toBeUndefined()
    expect(store.ids).toEqual([2])
  })

  it('clears currentItem when the removed row is the current one', async () => {
    categoryService.delete.mockResolvedValueOnce({})
    const store = useCategoryStore()
    store.currentItem = { id: 1 }
    store.ids = [1]
    store.byId = { 1: { id: 1 } }
    await store.remove(1)
    expect(store.currentItem).toBeNull()
  })
})

describe('categoryStore — getters', () => {
  it('items maps ids to byId entries', () => {
    const store = useCategoryStore()
    store.byId = { 1: { id: 1, name: 'A' }, 2: { id: 2, name: 'B' } }
    store.ids = [1, 2]
    expect(store.items).toEqual([{ id: 1, name: 'A' }, { id: 2, name: 'B' }])
  })

  it('hasItems is true when ids is non-empty', () => {
    const store = useCategoryStore()
    store.ids = [1]
    expect(store.hasItems).toBe(true)
  })

  it('isEmpty is true when ids is empty and status is not loading', () => {
    const store = useCategoryStore()
    expect(store.isEmpty).toBe(true)
    store.status = 'loading'
    expect(store.isEmpty).toBe(false)
  })
})

describe('categoryStore — reset', () => {
  it('clears state back to defaults', () => {
    const store = useCategoryStore()
    store.byId = { 1: { id: 1 } }
    store.ids = [1]
    store.reset()
    expect(store.byId).toEqual({})
    expect(store.ids).toEqual([])
    expect(store.pagination.per_page).toBe(500)
  })
})
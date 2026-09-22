// frontend/tests/unit/stores/questionStore.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/services/questionService', () => ({
  questionService: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    toggleVerify: vi.fn(),
    bulkVerify: vi.fn(),
    duplicate: vi.fn(),
    getUnverified: vi.fn(),
    bulkUpdateTags: vi.fn(),
  },
}))

import { questionService } from '@/services/questionService'
import { useQuestionStore } from '@/stores/questionStore'

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

describe('questionStore — fetchList', () => {
  it('populates byId/ids and pagination from the response', async () => {
    questionService.list.mockResolvedValueOnce({
      items: [
        { id: 1, question: 'A' },
        { id: 2, question: 'B' },
      ],
      page: 1,
      per_page: 20,
      total: 2,
      total_pages: 1,
    })
    const store = useQuestionStore()
    await store.fetchList({})
    expect(store.ids).toEqual([1, 2])
    expect(store.byId[1]).toEqual({ id: 1, question: 'A' })
    expect(store.pagination.total).toBe(2)
  })

  it('records the reported page and per_page', async () => {
    questionService.list.mockResolvedValueOnce({
      items: [],
      page: 3,
      per_page: 50,
      total: 130,
      total_pages: 3,
    })
    const store = useQuestionStore()
    await store.fetchList({ page: 3, per_page: 50 })
    expect(store.pagination.page).toBe(3)
    expect(store.pagination.per_page).toBe(50)
    expect(store.pagination.total_pages).toBe(3)
  })
})

describe('questionStore — create', () => {
  it('prepends the new question and increments the total', async () => {
    questionService.create.mockResolvedValueOnce({ id: 99, question: 'New' })
    const store = useQuestionStore()
    store.ids = [1, 2]
    store.pagination.total = 2
    await store.create({ question: 'New' })
    expect(store.ids[0]).toBe(99)
    expect(store.pagination.total).toBe(3)
  })
})

describe('questionStore — update', () => {
  it('replaces the row in byId', async () => {
    questionService.update.mockResolvedValueOnce({ id: 1, question: 'Edited' })
    const store = useQuestionStore()
    store.byId = { 1: { id: 1, question: 'Old', version: 1 } }
    await store.update(1, { question: 'Edited' })
    expect(store.byId[1].question).toBe('Edited')
  })

  it('adds expected_version automatically from the cached row', async () => {
    questionService.update.mockResolvedValueOnce({ id: 1, question: 'X' })
    const store = useQuestionStore()
    store.byId = { 1: { id: 1, version: 7 } }
    await store.update(1, { question: 'X' })
    expect(questionService.update).toHaveBeenCalledWith(1, {
      question: 'X',
      expected_version: 7,
    })
  })

  it('does not override an explicit expected_version', async () => {
    questionService.update.mockResolvedValueOnce({ id: 1 })
    const store = useQuestionStore()
    store.byId = { 1: { id: 1, version: 7 } }
    await store.update(1, { expected_version: 3 })
    expect(questionService.update).toHaveBeenCalledWith(1, { expected_version: 3 })
  })
})

describe('questionStore — remove', () => {
  it('drops the row from every list and decrements the total', async () => {
    questionService.delete.mockResolvedValueOnce({})
    const store = useQuestionStore()
    store.byId = { 1: { id: 1 }, 2: { id: 2 } }
    store.ids = [1, 2]
    store.unverifiedIds = [1]
    store.unverifiedById = { 1: { id: 1 } }
    store.pagination.total = 2
    await store.remove(1)
    expect(store.byId[1]).toBeUndefined()
    expect(store.ids).toEqual([2])
    expect(store.unverifiedIds).toEqual([])
    expect(store.pagination.total).toBe(1)
  })
})

describe('questionStore — toggleVerify', () => {
  it('applies the server-returned verified flag', async () => {
    questionService.toggleVerify.mockResolvedValueOnce({ verified: true })
    const store = useQuestionStore()
    store.byId = { 1: { id: 1, verified: false } }
    await store.toggleVerify(1)
    expect(store.byId[1].verified).toBe(true)
  })

  it('reverts the optimistic change if the request fails', async () => {
    questionService.toggleVerify.mockRejectedValueOnce({ message: 'x' })
    const store = useQuestionStore()
    store.byId = { 1: { id: 1, verified: false } }
    await store.toggleVerify(1)
    expect(store.byId[1].verified).toBe(false)
  })
})

describe('questionStore — bulkVerify', () => {
  it('calls the service with the right arguments', async () => {
    questionService.bulkVerify.mockResolvedValueOnce({ count: 3 })
    const store = useQuestionStore()
    await store.bulkVerify([1, 2, 3], 'verify', 'looks ok')
    expect(questionService.bulkVerify).toHaveBeenCalledWith(
      [1, 2, 3],
      'verify',
      'looks ok',
    )
  })
})

describe('questionStore — duplicate', () => {
  it('prepends the duplicated question', async () => {
    questionService.duplicate.mockResolvedValueOnce({ id: 200, question: 'Copy' })
    const store = useQuestionStore()
    store.ids = [1]
    store.pagination.total = 1
    await store.duplicate(1)
    expect(store.ids[0]).toBe(200)
    expect(store.pagination.total).toBe(2)
  })
})

describe('questionStore — fetchUnverified', () => {
  it('populates the unverified bucket and its pagination', async () => {
    questionService.getUnverified.mockResolvedValueOnce({
      items: [{ id: 5 }],
      page: 1,
      per_page: 20,
      total: 1,
      total_pages: 1,
    })
    const store = useQuestionStore()
    await store.fetchUnverified({})
    expect(store.unverifiedIds).toEqual([5])
    expect(store.unverifiedPagination.total).toBe(1)
  })
})

describe('questionStore — filters', () => {
  it('setFilters merges onto the existing object', () => {
    const store = useQuestionStore()
    store.setFilters({ difficulty: 'easy' })
    store.setFilters({ verified: 'yes' })
    expect(store.filters).toEqual({ difficulty: 'easy', verified: 'yes' })
  })

  it('resetFilters clears the object', () => {
    const store = useQuestionStore()
    store.setFilters({ difficulty: 'easy' })
    store.resetFilters()
    expect(store.filters).toEqual({})
  })
})

describe('questionStore — reset', () => {
  it('returns every state key to its default', () => {
    const store = useQuestionStore()
    store.byId = { 1: { id: 1 } }
    store.ids = [1]
    store.pagination.total = 1
    store.reset()
    expect(store.byId).toEqual({})
    expect(store.ids).toEqual([])
    expect(store.pagination.total).toBe(0)
  })
})
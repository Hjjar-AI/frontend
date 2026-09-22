// frontend/tests/unit/stores/masterExamStore.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/services/masterExamService', () => ({
  masterExamService: {
    list: vi.fn(),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    addQuestions: vi.fn(),
    removeQuestion: vi.fn(),
    reorder: vi.fn(),
    addDraft: vi.fn(),
    publish: vi.fn(),
    cancel: vi.fn(),
    publishToBank: vi.fn(),
    acknowledge: vi.fn(),
    needsAcknowledgement: vi.fn(),
    draftsLibrary: vi.fn(),
    updateDraft: vi.fn(),
    deleteDraft: vi.fn(),
  },
}))

import { masterExamService } from '@/services/masterExamService'
import { useMasterExamStore } from '@/stores/masterExamStore'

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

// ── List and detail ────────────────────────────────────────────────

describe('masterExamStore — fetchList', () => {
  it('populates items from the response', async () => {
    masterExamService.list.mockResolvedValueOnce({
      items: [
        { id: 1, name: 'Exam A', is_owner: true, status: 'active' },
        { id: 2, name: 'Exam B', is_owner: false, status: 'scheduled' },
      ],
    })
    const store = useMasterExamStore()
    await store.fetchList()
    expect(store.items).toHaveLength(2)
    expect(store.items[0].name).toBe('Exam A')
  })

  it('leaves items empty on failure', async () => {
    masterExamService.list.mockRejectedValueOnce({ message: 'fail' })
    const store = useMasterExamStore()
    await store.fetchList()
    expect(store.items).toEqual([])
  })
})

describe('masterExamStore — getters', () => {
  it('ownedExams filters items where is_owner is true', () => {
    const store = useMasterExamStore()
    store.items = [
      { id: 1, is_owner: true, status: 'active' },
      { id: 2, is_owner: false, status: 'active' },
      { id: 3, is_owner: true, status: 'scheduled' },
    ]
    expect(store.ownedExams.map(e => e.id)).toEqual([1, 3])
  })

  it('assignedExams filters items where is_owner is false', () => {
    const store = useMasterExamStore()
    store.items = [
      { id: 1, is_owner: true },
      { id: 2, is_owner: false },
    ]
    expect(store.assignedExams.map(e => e.id)).toEqual([2])
  })

  it('activeExams filters by status', () => {
    const store = useMasterExamStore()
    store.items = [
      { id: 1, status: 'active' },
      { id: 2, status: 'scheduled' },
      { id: 3, status: 'active' },
    ]
    expect(store.activeExams.map(e => e.id)).toEqual([1, 3])
  })

  it('upcomingExams filters scheduled exams', () => {
    const store = useMasterExamStore()
    store.items = [
      { id: 1, status: 'active' },
      { id: 2, status: 'scheduled' },
    ]
    expect(store.upcomingExams.map(e => e.id)).toEqual([2])
  })
})

describe('masterExamStore — fetchOne', () => {
  it('stores the exam in byId', async () => {
    masterExamService.get.mockResolvedValueOnce({ id: 5, name: 'Exam E' })
    const store = useMasterExamStore()
    await store.fetchOne(5)
    expect(store.byId[5]).toEqual({ id: 5, name: 'Exam E' })
  })
})

// ── CRUD ────────────────────────────────────────────────────────────

describe('masterExamStore — create', () => {
  it('prepends the exam to items and records it in byId', async () => {
    masterExamService.create.mockResolvedValueOnce({ id: 9, name: 'New' })
    const store = useMasterExamStore()
    store.items = [{ id: 1 }]
    await store.create({ name: 'New' })
    expect(store.items[0].id).toBe(9)
    expect(store.byId[9]).toEqual({ id: 9, name: 'New' })
  })
})

describe('masterExamStore — update', () => {
  it('replaces the matching row in both items and byId', async () => {
    masterExamService.update.mockResolvedValueOnce({ id: 1, name: 'Renamed' })
    const store = useMasterExamStore()
    store.items = [{ id: 1, name: 'Old', extra: true }]
    store.byId = { 1: { id: 1, name: 'Old' } }
    await store.update(1, { name: 'Renamed' })
    expect(store.items[0].name).toBe('Renamed')
    // The update is a merge, so keys not in the response survive.
    expect(store.items[0].extra).toBe(true)
    expect(store.byId[1].name).toBe('Renamed')
  })
})

describe('masterExamStore — remove', () => {
  it('drops the exam from items and byId', async () => {
    masterExamService.delete.mockResolvedValueOnce({})
    const store = useMasterExamStore()
    store.items = [{ id: 1 }, { id: 2 }]
    store.byId = { 1: { id: 1 }, 2: { id: 2 } }
    await store.remove(1, 'keep_drafts')
    expect(store.items.map(e => e.id)).toEqual([2])
    expect(store.byId[1]).toBeUndefined()
    expect(masterExamService.delete).toHaveBeenCalledWith(1, 'keep_drafts')
  })
})

// ── Composition ────────────────────────────────────────────────────

describe('masterExamStore — addQuestions / removeQuestion / reorder', () => {
  it('addQuestions replaces the byId entry with the server response', async () => {
    masterExamService.addQuestions.mockResolvedValueOnce({ id: 1, question_ids: [1, 2] })
    const store = useMasterExamStore()
    await store.addQuestions(1, [1, 2])
    expect(store.byId[1]).toEqual({ id: 1, question_ids: [1, 2] })
  })

  it('removeQuestion replaces the byId entry with the server response', async () => {
    masterExamService.removeQuestion.mockResolvedValueOnce({ id: 1, question_ids: [1] })
    const store = useMasterExamStore()
    await store.removeQuestion(1, 2)
    expect(store.byId[1].question_ids).toEqual([1])
  })

  it('reorder replaces the byId entry with the server response', async () => {
    masterExamService.reorder.mockResolvedValueOnce({ id: 1, question_ids: [3, 2, 1] })
    const store = useMasterExamStore()
    await store.reorder(1, [3, 2, 1])
    expect(store.byId[1].question_ids).toEqual([3, 2, 1])
  })
})

// ── Lifecycle ──────────────────────────────────────────────────────

describe('masterExamStore — publish', () => {
  it('updates byId and items entries', async () => {
    masterExamService.publish.mockResolvedValueOnce({
      id: 1,
      status: 'scheduled',
      stored_status: 'published',
    })
    const store = useMasterExamStore()
    store.items = [{ id: 1, status: 'draft', stored_status: 'draft' }]
    store.byId = { 1: { id: 1, status: 'draft' } }
    await store.publish(1)
    expect(store.byId[1].stored_status).toBe('published')
    expect(store.items[0].stored_status).toBe('published')
  })
})

describe('masterExamStore — cancel', () => {
  it('updates byId and items entries', async () => {
    masterExamService.cancel.mockResolvedValueOnce({ id: 1, stored_status: 'cancelled' })
    const store = useMasterExamStore()
    store.items = [{ id: 1, stored_status: 'published' }]
    store.byId = { 1: { id: 1, stored_status: 'published' } }
    await store.cancel(1)
    expect(store.byId[1].stored_status).toBe('cancelled')
    expect(store.items[0].stored_status).toBe('cancelled')
  })
})

describe('masterExamStore — publishToBank', () => {
  it('updates the byId entry', async () => {
    masterExamService.publishToBank.mockResolvedValueOnce({
      id: 1,
      stored_status: 'published_to_bank',
    })
    const store = useMasterExamStore()
    await store.publishToBank(1)
    expect(store.byId[1].stored_status).toBe('published_to_bank')
  })
})

// ── Acknowledgement ────────────────────────────────────────────────

describe('masterExamStore — acknowledge', () => {
  it('removes the exam from needsAckItems on success', async () => {
    masterExamService.acknowledge.mockResolvedValueOnce({})
    const store = useMasterExamStore()
    store.needsAckItems = [
      { id: 1, name: 'A' },
      { id: 2, name: 'B' },
    ]
    store.needsAckCount = 2
    await store.acknowledge(1)
    expect(store.needsAckItems.map(e => e.id)).toEqual([2])
    expect(store.needsAckCount).toBe(1)
  })

  it('does nothing on failure (the item stays pending)', async () => {
    masterExamService.acknowledge.mockRejectedValueOnce({ message: 'fail' })
    const store = useMasterExamStore()
    store.needsAckItems = [{ id: 1, name: 'A' }]
    store.needsAckCount = 1
    await store.acknowledge(1)
    expect(store.needsAckItems).toHaveLength(1)
    expect(store.needsAckCount).toBe(1)
  })
})

describe('masterExamStore — fetchNeedsAck', () => {
  it('populates needsAckItems and count from the response', async () => {
    masterExamService.needsAcknowledgement.mockResolvedValueOnce({
      count: 2,
      items: [{ id: 1 }, { id: 2 }],
    })
    const store = useMasterExamStore()
    await store.fetchNeedsAck()
    expect(store.needsAckCount).toBe(2)
    expect(store.needsAckItems).toHaveLength(2)
  })
})

// ── Drafts library ─────────────────────────────────────────────────

describe('masterExamStore — fetchDrafts', () => {
  it('populates drafts and total', async () => {
    masterExamService.draftsLibrary.mockResolvedValueOnce({
      items: [{ id: 7, question: 'Q7' }],
      total: 1,
    })
    const store = useMasterExamStore()
    await store.fetchDrafts()
    expect(store.drafts).toHaveLength(1)
    expect(store.draftsTotal).toBe(1)
  })

  it('passes params through to the service', async () => {
    masterExamService.draftsLibrary.mockResolvedValueOnce({ items: [], total: 0 })
    const store = useMasterExamStore()
    await store.fetchDrafts({ search: 'x', usage: 'orphan' })
    expect(masterExamService.draftsLibrary).toHaveBeenCalledWith({
      search: 'x',
      usage: 'orphan',
    })
  })
})

describe('masterExamStore — addDraft', () => {
  it('prepends the draft and increments the total', async () => {
    masterExamService.addDraft.mockResolvedValueOnce({ id: 8, question: 'Q8' })
    const store = useMasterExamStore()
    store.drafts = [{ id: 7 }]
    store.draftsTotal = 1
    await store.addDraft(1, { question: 'Q8' })
    expect(store.drafts[0].id).toBe(8)
    expect(store.draftsTotal).toBe(2)
  })
})

describe('masterExamStore — updateDraft', () => {
  it('replaces the matching row', async () => {
    masterExamService.updateDraft.mockResolvedValueOnce({ id: 7, question: 'Updated' })
    const store = useMasterExamStore()
    store.drafts = [{ id: 7, question: 'Old' }]
    await store.updateDraft(7, { question: 'Updated' })
    expect(store.drafts[0].question).toBe('Updated')
  })
})

describe('masterExamStore — deleteDraft', () => {
  it('removes the row and decrements the total', async () => {
    masterExamService.deleteDraft.mockResolvedValueOnce({})
    const store = useMasterExamStore()
    store.drafts = [{ id: 7 }, { id: 8 }]
    store.draftsTotal = 2
    await store.deleteDraft(7)
    expect(store.drafts.map(d => d.id)).toEqual([8])
    expect(store.draftsTotal).toBe(1)
  })

  it('does not go negative if the server count was already zero', async () => {
    masterExamService.deleteDraft.mockResolvedValueOnce({})
    const store = useMasterExamStore()
    store.drafts = [{ id: 7 }]
    store.draftsTotal = 0
    await store.deleteDraft(7)
    expect(store.draftsTotal).toBe(0)
  })
})

describe('masterExamStore — setters', () => {
  it('setDraftsSearch stores the query', () => {
    const store = useMasterExamStore()
    store.setDraftsSearch('foo')
    expect(store.draftsSearch).toBe('foo')
  })

  it('setDraftsUsageFilter stores the filter', () => {
    const store = useMasterExamStore()
    store.setDraftsUsageFilter('orphan')
    expect(store.draftsUsageFilter).toBe('orphan')
  })
})

// ── reset ──────────────────────────────────────────────────────────

describe('masterExamStore — reset', () => {
  it('returns every field to its default', () => {
    const store = useMasterExamStore()
    store.items = [{ id: 1 }]
    store.byId = { 1: { id: 1 } }
    store.drafts = [{ id: 7 }]
    store.draftsTotal = 5
    store.needsAckCount = 3
    store.needsAckItems = [{ id: 1 }]
    store.reset()
    expect(store.items).toEqual([])
    expect(store.byId).toEqual({})
    expect(store.drafts).toEqual([])
    expect(store.draftsTotal).toBe(0)
    expect(store.needsAckCount).toBe(0)
    expect(store.needsAckItems).toEqual([])
  })
})
// frontend/tests/unit/stores/testSessionStore.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

// The store builds its service via `createTestService(mode)`. We
// mock the factory to return a single shared mock service so tests
// can control the responses directly.
const mocks = vi.hoisted(() => {
  const service = {
    start: vi.fn(),
    getQuestion: vi.fn(),
    submitAnswer: vi.fn(),
    finish: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    discardProgress: vi.fn(),
    status: vi.fn(),
  }
  return { service }
})

vi.mock('@/services/testServiceFactory', () => ({
  createTestService: vi.fn(() => mocks.service),
}))

vi.mock('@/composables/useDialog', () => ({
  useDialog: () => ({
    confirm: vi.fn().mockResolvedValue(true),
  }),
}))

import { useTestSessionStore } from '@/stores/testSessionStore'

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
  sessionStorage.clear()
})

describe('testSessionStore — start', () => {
  it('stores the session and commits the mode on success', async () => {
    mocks.service.start.mockResolvedValueOnce({
      session_id: 'sess-1',
      question_ids: [1, 2, 3],
      tag: 'Cardiology',
      duration_minutes: 45,
    })
    const store = useTestSessionStore()
    await store.start('exam', { tag: 'Cardiology', session_label: 'Cardiology' })
    expect(store.sessionId).toBe('sess-1')
    expect(store.questionIds).toEqual([1, 2, 3])
    expect(store.mode).toBe('exam')
    expect(store.durationMinutes).toBe(45)
    expect(store.isActive).toBe(true)
  })

  it('leaves the mode unchanged when the request fails', async () => {
    mocks.service.start.mockRejectedValueOnce({ message: 'fail' })
    const store = useTestSessionStore()
    store.mode = 'study'
    await store.start('exam', {})
    expect(store.mode).toBe('study')
  })

  it('forces a stopwatch when disable_timer is set', async () => {
    mocks.service.start.mockResolvedValueOnce({
      session_id: 'sess-2',
      question_ids: [1],
      duration_minutes: 60,
    })
    const store = useTestSessionStore()
    await store.start('study', { disable_timer: true, use_srs: true })
    expect(store.durationMinutes).toBeNull()
  })

  it('sends every source-shaped key the backend accepts', async () => {
    mocks.service.start.mockResolvedValueOnce({ session_id: 's', question_ids: [1] })
    const store = useTestSessionStore()
    await store.start('study', {
      category_ids: [3, 7],
      difficulty: 'hard',
      tags_filter: 'a,b',
      verified_only: true,
      use_bookmarks: true,
      session_label: 'My session',
    })
    const arg = mocks.service.start.mock.calls[0][0]
    expect(arg.category_ids).toEqual([3, 7])
    expect(arg.difficulty).toBe('hard')
    expect(arg.tags_filter).toBe('a,b')
    expect(arg.verified_only).toBe(true)
    expect(arg.use_bookmarks).toBe(true)
    expect(arg.session_label).toBe('My session')
  })
})

describe('testSessionStore — submitAnswer', () => {
  it('stores the answer and advances the index on action=next', async () => {
    mocks.service.start.mockResolvedValueOnce({
      session_id: 's1',
      question_ids: [10, 20],
    })
    mocks.service.submitAnswer.mockResolvedValueOnce({ new_index: 1 })
    const store = useTestSessionStore()
    await store.start('exam', {})
    await store.submitAnswer(1, 'next', null, true)
    expect(store.answers[0]).toBe(1)
    expect(store.currentIndex).toBe(1)
  })

  it('rejects an out-of-range answer with a localized message', async () => {
    mocks.service.start.mockResolvedValueOnce({
      session_id: 's1',
      question_ids: [10],
    })
    const store = useTestSessionStore()
    await store.start('exam', {})
    await expect(store.submitAnswer(999, 'next')).rejects.toThrow()
    expect(mocks.service.submitAnswer).not.toHaveBeenCalled()
  })

  it('rejects an answer of zero', async () => {
    mocks.service.start.mockResolvedValueOnce({
      session_id: 's1',
      question_ids: [10],
    })
    const store = useTestSessionStore()
    await store.start('exam', {})
    await expect(store.submitAnswer(0, 'next')).rejects.toThrow()
  })

  it('records confidence alongside the answer', async () => {
    mocks.service.start.mockResolvedValueOnce({
      session_id: 's1',
      question_ids: [10],
    })
    mocks.service.submitAnswer.mockResolvedValueOnce({ new_index: 0 })
    const store = useTestSessionStore()
    await store.start('exam', {})
    await store.submitAnswer(1, 'next', null, false)
    expect(store.confidence[0]).toBe(false)
  })
})

describe('testSessionStore — finish', () => {
  it('stores the results and clears the session on success', async () => {
    mocks.service.start.mockResolvedValueOnce({
      session_id: 's1',
      question_ids: [10],
    })
    mocks.service.finish.mockResolvedValueOnce({
      results: [{ id: 10, is_correct: true }],
      correct_count: 1,
      total_questions: 1,
      accuracy: 100,
    })
    const store = useTestSessionStore()
    await store.start('exam', {})
    await store.finish()
    expect(store.results).toBeTruthy()
    expect(store.isActive).toBe(false)
    expect(store.sessionId).toBeNull()
  })
})

describe('testSessionStore — pause / resume', () => {
  it('pause flips isActive to false', async () => {
    mocks.service.start.mockResolvedValueOnce({
      session_id: 's1',
      question_ids: [1],
    })
    mocks.service.pause.mockResolvedValueOnce({})
    const store = useTestSessionStore()
    await store.start('exam', {})
    await store.pause()
    expect(store.isActive).toBe(false)
  })

  it('resume calls the service and re-applies the session state', async () => {
    const store = useTestSessionStore()
    store.mode = 'exam'
    store.sessionId = 's1'
    mocks.service.resume.mockResolvedValueOnce({
      session_id: 's1',
      question_ids: [1, 2],
      current_index: 1,
      answers: { '0': 2 },
      tag: 'T',
    })
    await store.resume()
    expect(store.questionIds).toEqual([1, 2])
    expect(store.currentIndex).toBe(1)
    expect(store.answers[0]).toBe(2)
  })
})

describe('testSessionStore — hydrateFromSession', () => {
  it('restores mode and session id from sessionStorage', () => {
    sessionStorage.setItem('test_session_mode', 'study')
    sessionStorage.setItem('test_session_id', 'sess-restored')
    const store = useTestSessionStore()
    const ok = store.hydrateFromSession()
    expect(ok).toBe(true)
    expect(store.mode).toBe('study')
    expect(store.sessionId).toBe('sess-restored')
  })

  it('rejects an invalid mode', () => {
    sessionStorage.setItem('test_session_mode', 'nonsense')
    sessionStorage.setItem('test_session_id', 'sess')
    const store = useTestSessionStore()
    expect(store.hydrateFromSession()).toBe(false)
  })

  it('returns false when sessionStorage is empty', () => {
    const store = useTestSessionStore()
    expect(store.hydrateFromSession()).toBe(false)
  })
})

describe('testSessionStore — reset', () => {
  it('clears every in-memory field and the sessionStorage keys', () => {
    sessionStorage.setItem('test_session_mode', 'exam')
    sessionStorage.setItem('test_session_id', 's1')
    const store = useTestSessionStore()
    store.sessionId = 's1'
    store.mode = 'exam'
    store.questionIds = [1, 2]
    store.reset()
    expect(store.sessionId).toBeNull()
    expect(store.mode).toBeNull()
    expect(store.questionIds).toEqual([])
    expect(sessionStorage.getItem('test_session_mode')).toBeNull()
    expect(sessionStorage.getItem('test_session_id')).toBeNull()
  })
})
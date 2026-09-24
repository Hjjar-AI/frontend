// frontend/tests/unit/stores/masterExamAttemptStore.test.js
//
// Store tests for the master-exam attempt lifecycle.
//
// FOCUS
// -----
// The most valuable tests in this file are the `TIME_EXPIRED`
// detection group. When the backend force-finishes an attempt
// because the deadline has passed, it returns a 400 with a
// structured `details.code` of `'TIME_EXPIRED'`. The store's
// `submitAnswer` error handler looks for that code (with a
// message-substring fallback) and, when it finds it, sets
// `finishedAt` — which flips the derived `isComplete` getter to
// true and causes the runner's watcher to route the user to the
// result page.
//
// If that detection ever breaks, the user is stranded on a
// question whose every subsequent submit returns the same 400.
// There is no visible error beyond a toast; the user has no way
// to leave except to close the tab. That is the class of bug this
// group of tests exists to prevent.
//
// The remaining groups cover the ordinary lifecycle paths:
// start, question fetch, navigation, finish, poll, and reset.

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/services/masterExamService', () => ({
  masterExamService: {
    startAttempt: vi.fn(),
    attemptStatus: vi.fn(),
    attemptQuestion: vi.fn(),
    submitAnswer: vi.fn(),
    gotoQuestion: vi.fn(),
    finishAttempt: vi.fn(),
    flagQuestion: vi.fn(),
  },
}))

vi.mock('@/composables/useNotify', () => ({
  useNotify: () => ({ notify: vi.fn() }),
}))

import { masterExamService } from '@/services/masterExamService'
import { useMasterExamAttemptStore } from '@/stores/masterExamAttemptStore'

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

// ── Helpers ────────────────────────────────────────────────────────

function setupActiveAttempt(store, { currentQuestionId = 42 } = {}) {
  store.examId = 1
  store.sessionId = 'sess-1'
  store.attemptId = 10
  store.isPreview = false
  store.isMakeup = false
  store.questionIds = [42, 43, 44]
  store.currentQuestionId = currentQuestionId
  store.answers = {}
  store.deadlineAt = null
}

// ── start ──────────────────────────────────────────────────────────

describe('masterExamAttemptStore — start', () => {
  it('populates state from a non-preview attempt', async () => {
    const startedAt = new Date('2026-01-01T09:00:00Z')
    const deadlineAt = new Date('2026-01-01T09:30:00Z')
    masterExamService.startAttempt.mockResolvedValueOnce({
      id: 10,
      session_id: 'sess-1',
      exam_name: 'Final Exam',
      question_ids: [1, 2, 3],
      answers: {},
      current_question_id: 1,
      duration_minutes: 30,
      grace_seconds: 180,
      is_makeup: false,
      is_preview: false,
      started_at: startedAt.toISOString(),
      deadline_at: deadlineAt.toISOString(),
    })
    masterExamService.attemptStatus.mockResolvedValueOnce({
      server_now: new Date().toISOString(),
    })

    const store = useMasterExamAttemptStore()
    await store.start(1, {})

    expect(store.examId).toBe(1)
    expect(store.sessionId).toBe('sess-1')
    expect(store.attemptId).toBe(10)
    expect(store.examName).toBe('Final Exam')
    expect(store.questionIds).toEqual([1, 2, 3])
    expect(store.currentQuestionId).toBe(1)
    expect(store.durationMinutes).toBe(30)
    expect(store.graceSeconds).toBe(180)
    expect(store.deadlineAt).toEqual(deadlineAt)
  })

  it('populates previewQuestions from a preview attempt', async () => {
    masterExamService.startAttempt.mockResolvedValueOnce({
      session_id: 'prev-1',
      exam_name: 'Draft',
      question_ids: [7],
      current_question_id: 7,
      is_preview: true,
      questions: [
        { id: 7, text: 'Q7', choices: ['a', 'b'], correct_answer: 1, explanation: 'X' },
      ],
    })

    const store = useMasterExamAttemptStore()
    await store.start(1, { preview: true })

    expect(store.isPreview).toBe(true)
    expect(store.previewQuestions[7]).toBeTruthy()
    expect(store.previewQuestions[7].correct_answer).toBe(1)
    expect(masterExamService.attemptStatus).not.toHaveBeenCalled()
  })

  it('resets prior state before the new start', async () => {
    masterExamService.startAttempt.mockResolvedValueOnce({
      session_id: 's2',
      question_ids: [1],
      current_question_id: 1,
      started_at: new Date().toISOString(),
      deadline_at: new Date(Date.now() + 60_000).toISOString(),
    })
    masterExamService.attemptStatus.mockResolvedValueOnce({
      server_now: new Date().toISOString(),
    })

    const store = useMasterExamAttemptStore()
    store.answers = { 99: { answer: 1 } }
    store.finishedAt = new Date()
    await store.start(1, {})

    expect(store.answers).toEqual({})
    expect(store.finishedAt).toBeNull()
  })
})

// ── submitAnswer — happy path ──────────────────────────────────────

describe('masterExamAttemptStore — submitAnswer (happy path)', () => {
  it('stores the answer and advances the current question', async () => {
    masterExamService.submitAnswer.mockResolvedValueOnce({
      success: true,
      current_question_id: 43,
    })
    const store = useMasterExamAttemptStore()
    setupActiveAttempt(store)

    await store.submitAnswer(2, 3)

    expect(store.answers['42']).toEqual({ answer: 2, confidence: 3 })
    expect(store.currentQuestionId).toBe(43)
  })

  it('returns null and does nothing when there is no current question', async () => {
    const store = useMasterExamAttemptStore()
    setupActiveAttempt(store, { currentQuestionId: null })

    const result = await store.submitAnswer(1, true)

    expect(result).toBeNull()
    expect(masterExamService.submitAnswer).not.toHaveBeenCalled()
  })

  it('sends the answer under the question_id key the backend expects', async () => {
    masterExamService.submitAnswer.mockResolvedValueOnce({
      current_question_id: 42,
    })
    const store = useMasterExamAttemptStore()
    setupActiveAttempt(store)

    await store.submitAnswer(3, 2)

    expect(masterExamService.submitAnswer).toHaveBeenCalledWith(1, {
      questionId: 42,
      answer: 3,
      confidence: 2,
    })
  })
})

// ── submitAnswer — TIME_EXPIRED detection ──────────────────────────
//
// The critical group. See the file header.

describe('masterExamAttemptStore — submitAnswer TIME_EXPIRED (primary path)', () => {
  it('marks the attempt complete when details.code is TIME_EXPIRED', async () => {
    masterExamService.submitAnswer.mockRejectedValueOnce({
      code: 400,
      message: 'انتهى وقت الامتحان وتم إنهاء المحاولة تلقائياً.',
      details: { code: 'TIME_EXPIRED' },
    })
    const store = useMasterExamAttemptStore()
    setupActiveAttempt(store)

    await store.submitAnswer(3, true)

    // The critical assertion: `finishedAt` is set, so the derived
    // `isComplete` getter flips to true and the runner's watcher
    // routes the user to the result page.
    expect(store.finishedAt).toBeInstanceOf(Date)
    expect(store.isComplete).toBe(true)
  })

  it('reverts the optimistic answer when TIME_EXPIRED is detected', async () => {
    masterExamService.submitAnswer.mockRejectedValueOnce({
      details: { code: 'TIME_EXPIRED' },
      message: '',
    })
    const store = useMasterExamAttemptStore()
    setupActiveAttempt(store)
    store.answers = { 41: { answer: 1 } }

    await store.submitAnswer(3, true)

    // The optimistic answer for question 42 is gone; the prior
    // answer for 41 is untouched.
    expect(store.answers['42']).toBeUndefined()
    expect(store.answers['41']).toEqual({ answer: 1 })
  })

  it('also detects TIME_EXPIRED when it appears inside a longer message', async () => {
    masterExamService.submitAnswer.mockRejectedValueOnce({
      code: 400,
      message: 'Server refused: TIME_EXPIRED at 2026-01-01T09:30:00Z',
      details: { code: 'TIME_EXPIRED' },
    })
    const store = useMasterExamAttemptStore()
    setupActiveAttempt(store)

    await store.submitAnswer(1, true)

    expect(store.isComplete).toBe(true)
  })
})

describe('masterExamAttemptStore — submitAnswer TIME_EXPIRED (fallback path)', () => {
  it('detects TIME_EXPIRED when only the message carries it', async () => {
    // No `details.code` — the fallback path checks `err.message`.
    masterExamService.submitAnswer.mockRejectedValueOnce({
      code: 400,
      message: 'TIME_EXPIRED',
    })
    const store = useMasterExamAttemptStore()
    setupActiveAttempt(store)

    await store.submitAnswer(1, true)

    expect(store.finishedAt).toBeInstanceOf(Date)
  })

  it('detects TIME_EXPIRED as a substring of a longer message', async () => {
    masterExamService.submitAnswer.mockRejectedValueOnce({
      code: 400,
      message: 'error: TIME_EXPIRED — attempt already finished',
    })
    const store = useMasterExamAttemptStore()
    setupActiveAttempt(store)

    await store.submitAnswer(1, true)

    expect(store.finishedAt).toBeInstanceOf(Date)
  })
})

describe('masterExamAttemptStore — submitAnswer non-TIME_EXPIRED errors', () => {
  it('does not mark the attempt complete on a generic 400', async () => {
    masterExamService.submitAnswer.mockRejectedValueOnce({
      code: 400,
      message: 'إجابة غير صالحة',
      details: { code: 'QUESTION_NOT_IN_ATTEMPT' },
    })
    const store = useMasterExamAttemptStore()
    setupActiveAttempt(store)

    await store.submitAnswer(1, true)

    expect(store.finishedAt).toBeNull()
    expect(store.isComplete).toBe(false)
  })

  it('does not mark the attempt complete on a network error', async () => {
    masterExamService.submitAnswer.mockRejectedValueOnce({
      code: 'NETWORK',
      message: 'تعذر الاتصال بالخادم.',
    })
    const store = useMasterExamAttemptStore()
    setupActiveAttempt(store)

    await store.submitAnswer(1, true)

    expect(store.finishedAt).toBeNull()
  })

  it('reverts the optimistic answer on any error', async () => {
    masterExamService.submitAnswer.mockRejectedValueOnce({
      code: 400,
      message: 'bad',
    })
    const store = useMasterExamAttemptStore()
    setupActiveAttempt(store)

    await store.submitAnswer(1, true)

    expect(store.answers['42']).toBeUndefined()
  })

  it('restores the previous answer when the store had one', async () => {
    masterExamService.submitAnswer.mockRejectedValueOnce({
      code: 400,
      message: 'bad',
    })
    const store = useMasterExamAttemptStore()
    setupActiveAttempt(store)
    store.answers = { 42: { answer: 1, confidence: true } }

    await store.submitAnswer(2, true)

    expect(store.answers['42']).toEqual({ answer: 1, confidence: true })
  })
})

// ── Preview mode ───────────────────────────────────────────────────

describe('masterExamAttemptStore — submitAnswer in preview mode', () => {
  it('does not hit the API and sets previewFeedback locally', async () => {
    const store = useMasterExamAttemptStore()
    setupActiveAttempt(store)
    store.isPreview = true
    store.previewQuestions = {
      42: { id: 42, correct_answer: 2, explanation: 'Because' },
    }

    const result = await store.submitAnswer(2, true)

    expect(masterExamService.submitAnswer).not.toHaveBeenCalled()
    expect(result.success).toBe(true)
    expect(store.previewFeedback.isCorrect).toBe(true)
    expect(store.previewFeedback.explanation).toBe('Because')
  })

  it('records a wrong answer with the correct choice in feedback', async () => {
    const store = useMasterExamAttemptStore()
    setupActiveAttempt(store)
    store.isPreview = true
    store.previewQuestions = {
      42: { id: 42, correct_answer: 2, explanation: 'Because' },
    }

    await store.submitAnswer(1, true)

    expect(store.previewFeedback.isCorrect).toBe(false)
    expect(store.previewFeedback.correctAnswer).toBe(2)
  })
})

// ── fetchCurrentQuestion ───────────────────────────────────────────

describe('masterExamAttemptStore — fetchCurrentQuestion', () => {
  it('reads from previewQuestions in preview mode', async () => {
    const store = useMasterExamAttemptStore()
    store.isPreview = true
    store.currentQuestionId = 7
    store.previewQuestions = {
      7: { id: 7, text: 'Q7', choices: ['a', 'b'] },
    }

    const payload = await store.fetchCurrentQuestion()

    expect(masterExamService.attemptQuestion).not.toHaveBeenCalled()
    expect(payload.question.id).toBe(7)
    expect(store.currentQuestion.text).toBe('Q7')
  })

  it('calls the API in normal mode and records a saved answer', async () => {
    masterExamService.attemptQuestion.mockResolvedValueOnce({
      question: { id: 42, text: 'Q42', choices: ['a', 'b'] },
      saved_answer: 2,
      saved_confidence: false,
    })
    const store = useMasterExamAttemptStore()
    setupActiveAttempt(store)

    await store.fetchCurrentQuestion()

    expect(store.currentQuestion.id).toBe(42)
    expect(store.answers['42']).toEqual({ answer: 2, confidence: 2 })
  })

  it('does not overwrite answers when the server reports no saved answer', async () => {
    masterExamService.attemptQuestion.mockResolvedValueOnce({
      question: { id: 42, text: 'Q42', choices: ['a', 'b'] },
      saved_answer: null,
      saved_confidence: true,
    })
    const store = useMasterExamAttemptStore()
    setupActiveAttempt(store)

    await store.fetchCurrentQuestion()

    expect(store.answers['42']).toBeUndefined()
  })
})

// ── goto ───────────────────────────────────────────────────────────

describe('masterExamAttemptStore — goto', () => {
  it('updates currentQuestionId from the server response', async () => {
    masterExamService.gotoQuestion.mockResolvedValueOnce({
      current_question_id: 44,
    })
    const store = useMasterExamAttemptStore()
    setupActiveAttempt(store)

    await store.goto(44)

    expect(store.currentQuestionId).toBe(44)
    expect(masterExamService.gotoQuestion).toHaveBeenCalledWith(1, 44)
  })

  it('switches local state in preview mode without an API call', async () => {
    const store = useMasterExamAttemptStore()
    setupActiveAttempt(store)
    store.isPreview = true

    await store.goto(43)

    expect(store.currentQuestionId).toBe(43)
    expect(masterExamService.gotoQuestion).not.toHaveBeenCalled()
  })

  it('refuses to leave the question list in preview mode', async () => {
    const store = useMasterExamAttemptStore()
    setupActiveAttempt(store)
    store.isPreview = true

    const result = await store.goto(999)

    expect(result).toBeNull()
    expect(store.currentQuestionId).toBe(42)
  })
})

// ── finish ─────────────────────────────────────────────────────────

describe('masterExamAttemptStore — finish', () => {
  it('sets result and finishedAt from the server response', async () => {
    masterExamService.finishAttempt.mockResolvedValueOnce({
      id: 10,
      correct_count: 5,
      total_questions: 10,
      accuracy: 50,
      is_complete: true,
    })
    const store = useMasterExamAttemptStore()
    setupActiveAttempt(store)

    const result = await store.finish()

    expect(result.correct_count).toBe(5)
    expect(store.result.correct_count).toBe(5)
    expect(store.finishedAt).toBeInstanceOf(Date)
    expect(store.isComplete).toBe(true)
  })

  it('does not call the API in preview mode', async () => {
    const store = useMasterExamAttemptStore()
    setupActiveAttempt(store)
    store.isPreview = true

    const result = await store.finish()

    expect(masterExamService.finishAttempt).not.toHaveBeenCalled()
    expect(result.preview).toBe(true)
    expect(store.previewFinished).toBe(true)
    expect(store.finishedAt).toBeInstanceOf(Date)
  })
})

// ── pollStatus ─────────────────────────────────────────────────────

describe('masterExamAttemptStore — pollStatus', () => {
  it('updates serverOffsetMs from the response', async () => {
    const serverNow = new Date(Date.now() + 5000).toISOString()
    masterExamService.attemptStatus.mockResolvedValueOnce({
      server_now: serverNow,
      question_ids: [1, 2, 3],
      current_question_id: 2,
      is_complete: false,
    })
    const store = useMasterExamAttemptStore()
    setupActiveAttempt(store)

    await store.pollStatus()

    expect(store.serverOffsetMs).toBeGreaterThan(4000)
    expect(store.serverOffsetMs).toBeLessThan(6000)
    expect(store.currentQuestionId).toBe(2)
  })

  it('marks the attempt complete when the server reports is_complete', async () => {
    masterExamService.attemptStatus.mockResolvedValueOnce({
      server_now: new Date().toISOString(),
      is_complete: true,
    })
    const store = useMasterExamAttemptStore()
    setupActiveAttempt(store)

    await store.pollStatus()

    expect(store.finishedAt).toBeInstanceOf(Date)
  })

  it('does not overwrite a locally-set finishedAt', async () => {
    const existing = new Date('2026-01-01T00:00:00Z')
    masterExamService.attemptStatus.mockResolvedValueOnce({
      server_now: new Date().toISOString(),
      is_complete: true,
    })
    const store = useMasterExamAttemptStore()
    setupActiveAttempt(store)
    store.finishedAt = existing

    await store.pollStatus()

    expect(store.finishedAt).toBe(existing)
  })

  it('does nothing in preview mode', async () => {
    const store = useMasterExamAttemptStore()
    setupActiveAttempt(store)
    store.isPreview = true

    const result = await store.pollStatus()

    expect(result).toBeNull()
    expect(masterExamService.attemptStatus).not.toHaveBeenCalled()
  })

  it('syncs the question list when the server sends one', async () => {
    masterExamService.attemptStatus.mockResolvedValueOnce({
      server_now: new Date().toISOString(),
      question_ids: [5, 6, 7],
    })
    const store = useMasterExamAttemptStore()
    setupActiveAttempt(store)

    await store.pollStatus()

    expect(store.questionIds).toEqual([5, 6, 7])
  })
})

// ── Getters ────────────────────────────────────────────────────────

describe('masterExamAttemptStore — getters', () => {
  it('totalQuestions reads questionIds length', () => {
    const store = useMasterExamAttemptStore()
    store.questionIds = [1, 2, 3]
    expect(store.totalQuestions).toBe(3)
  })

  it('answeredCount reads the answers dict length', () => {
    const store = useMasterExamAttemptStore()
    store.answers = { 1: {}, 2: {} }
    expect(store.answeredCount).toBe(2)
  })

  it('isComplete is true only when finishedAt is set', () => {
    const store = useMasterExamAttemptStore()
    expect(store.isComplete).toBe(false)
    store.finishedAt = new Date()
    expect(store.isComplete).toBe(true)
  })

  it('remainingMs is null when there is no deadline', () => {
    const store = useMasterExamAttemptStore()
    store.deadlineAt = null
    expect(store.remainingMs).toBeNull()
  })

  it('isExpired is true when the deadline is in the past', () => {
    const store = useMasterExamAttemptStore()
    store.serverOffsetMs = 0
    store.deadlineAt = new Date(Date.now() - 1000)
    expect(store.isExpired).toBe(true)
  })

  it('isExpired is false when the deadline is in the future', () => {
    const store = useMasterExamAttemptStore()
    store.serverOffsetMs = 0
    store.deadlineAt = new Date(Date.now() + 60_000)
    expect(store.isExpired).toBe(false)
  })

  it('inGraceWindow is true inside the grace period', () => {
    const store = useMasterExamAttemptStore()
    store.serverOffsetMs = 0
    store.graceSeconds = 180
    store.deadlineAt = new Date(Date.now() - 60_000)
    expect(store.inGraceWindow).toBe(true)
  })

  it('inGraceWindow is false once the grace period elapses', () => {
    const store = useMasterExamAttemptStore()
    store.serverOffsetMs = 0
    store.graceSeconds = 180
    store.deadlineAt = new Date(Date.now() - 200_000)
    expect(store.inGraceWindow).toBe(false)
  })

  it('inGraceWindow is false before the deadline', () => {
    const store = useMasterExamAttemptStore()
    store.serverOffsetMs = 0
    store.graceSeconds = 180
    store.deadlineAt = new Date(Date.now() + 60_000)
    expect(store.inGraceWindow).toBe(false)
  })

  it('currentIndex is the index of currentQuestionId in questionIds', () => {
    const store = useMasterExamAttemptStore()
    store.questionIds = [1, 2, 3]
    store.currentQuestionId = 2
    expect(store.currentIndex).toBe(1)
  })
})

// ── reset ──────────────────────────────────────────────────────────

describe('masterExamAttemptStore — reset', () => {
  it('clears every state field back to its default', () => {
    const store = useMasterExamAttemptStore()
    store.examId = 1
    store.sessionId = 'x'
    store.questionIds = [1, 2]
    store.answers = { 1: { answer: 1 } }
    store.finishedAt = new Date()
    store.isPreview = true

    store.reset()

    expect(store.examId).toBeNull()
    expect(store.sessionId).toBeNull()
    expect(store.questionIds).toEqual([])
    expect(store.answers).toEqual({})
    expect(store.finishedAt).toBeNull()
    expect(store.isPreview).toBe(false)
  })
})

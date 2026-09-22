// frontend/tests/unit/services/masterExamService.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/services/api/client', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

import { apiClient } from '@/services/api/client'
import { masterExamService } from '@/services/masterExamService'

beforeEach(() => { vi.clearAllMocks() })

describe('masterExamService — CRUD', () => {
  it('list GETs /exam/master/', async () => {
    await masterExamService.list({ status: 'active' })
    expect(apiClient.get).toHaveBeenCalledWith('/exam/master/', {
      params: { status: 'active' },
    })
  })

  it('get GETs the detail URL', async () => {
    await masterExamService.get(3)
    expect(apiClient.get).toHaveBeenCalledWith('/exam/master/3/')
  })

  it('create POSTs the payload', async () => {
    const payload = { name: 'Exam 1', opens_at: '2026-01-01T09:00:00Z' }
    await masterExamService.create(payload)
    expect(apiClient.post).toHaveBeenCalledWith('/exam/master/', payload)
  })

  it('update PUTs the payload', async () => {
    await masterExamService.update(3, { name: 'X' })
    expect(apiClient.put).toHaveBeenCalledWith('/exam/master/3/', { name: 'X' })
  })

  it('delete sends delete_mode in the DELETE body', async () => {
    await masterExamService.delete(3, 'keep_drafts')
    expect(apiClient.delete).toHaveBeenCalledWith('/exam/master/3/', {
      data: { delete_mode: 'keep_drafts' },
    })
  })
})

describe('masterExamService — composition', () => {
  it('addQuestions POSTs question_ids', async () => {
    await masterExamService.addQuestions(3, [1, 2, 3])
    expect(apiClient.post).toHaveBeenCalledWith('/exam/master/3/questions/add/', {
      question_ids: [1, 2, 3],
    })
  })

  it('removeQuestion POSTs question_id', async () => {
    await masterExamService.removeQuestion(3, 42)
    expect(apiClient.post).toHaveBeenCalledWith(
      '/exam/master/3/questions/remove/',
      { question_id: 42 },
    )
  })

  it('reorder POSTs the ordered id list', async () => {
    await masterExamService.reorder(3, [9, 5, 1])
    expect(apiClient.post).toHaveBeenCalledWith(
      '/exam/master/3/questions/reorder/',
      { question_ids: [9, 5, 1] },
    )
  })

  it('addDraft POSTs the draft payload', async () => {
    const payload = { question: 'Q', choices: ['a', 'b'], correct_answer: 1 }
    await masterExamService.addDraft(3, payload)
    expect(apiClient.post).toHaveBeenCalledWith('/exam/master/3/drafts/', payload)
  })
})

describe('masterExamService — lifecycle', () => {
  it('publish POSTs to the publish URL', async () => {
    await masterExamService.publish(3)
    expect(apiClient.post).toHaveBeenCalledWith('/exam/master/3/publish/')
  })

  it('cancel POSTs to the cancel URL', async () => {
    await masterExamService.cancel(3)
    expect(apiClient.post).toHaveBeenCalledWith('/exam/master/3/cancel/')
  })

  it('publishToBank POSTs to the publish-to-bank URL', async () => {
    await masterExamService.publishToBank(3)
    expect(apiClient.post).toHaveBeenCalledWith('/exam/master/3/publish-to-bank/')
  })

  it('acknowledge POSTs to the acknowledge URL', async () => {
    await masterExamService.acknowledge(3)
    expect(apiClient.post).toHaveBeenCalledWith('/exam/master/3/acknowledge/')
  })

  it('needsAcknowledgement GETs the needs-ack URL', async () => {
    await masterExamService.needsAcknowledgement()
    expect(apiClient.get).toHaveBeenCalledWith('/exam/master/needs-acknowledgement/')
  })
})

describe('masterExamService — attempt lifecycle', () => {
  it('startAttempt defaults preview to false', async () => {
    await masterExamService.startAttempt(3)
    expect(apiClient.post).toHaveBeenCalledWith('/exam/master/3/start/', {
      preview: false,
    })
  })

  it('startAttempt forwards preview=true', async () => {
    await masterExamService.startAttempt(3, { preview: true })
    expect(apiClient.post).toHaveBeenCalledWith('/exam/master/3/start/', {
      preview: true,
    })
  })

  it('attemptStatus GETs the status URL', async () => {
    await masterExamService.attemptStatus(3)
    expect(apiClient.get).toHaveBeenCalledWith('/exam/master/3/attempt/status/')
  })

  it('attemptQuestion GETs the question URL', async () => {
    await masterExamService.attemptQuestion(3)
    expect(apiClient.get).toHaveBeenCalledWith('/exam/master/3/attempt/question/')
  })

  it('submitAnswer POSTs question_id, answer and confidence', async () => {
    await masterExamService.submitAnswer(3, {
      questionId: 42,
      answer: 2,
      confidence: true,
    })
    expect(apiClient.post).toHaveBeenCalledWith('/exam/master/3/attempt/answer/', {
      question_id: 42,
      answer: 2,
      confidence: true,
    })
  })

  it('gotoQuestion POSTs question_id', async () => {
    await masterExamService.gotoQuestion(3, 42)
    expect(apiClient.post).toHaveBeenCalledWith('/exam/master/3/attempt/goto/', {
      question_id: 42,
    })
  })

  it('finishAttempt POSTs to the finish URL', async () => {
    await masterExamService.finishAttempt(3)
    expect(apiClient.post).toHaveBeenCalledWith('/exam/master/3/attempt/finish/')
  })

  it('flagQuestion POSTs question_id and reason', async () => {
    await masterExamService.flagQuestion(3, { questionId: 42, reason: 'unclear' })
    expect(apiClient.post).toHaveBeenCalledWith('/exam/master/3/attempt/flag/', {
      question_id: 42,
      reason: 'unclear',
    })
  })
})

describe('masterExamService — results', () => {
  it('results GETs the results URL', async () => {
    await masterExamService.results(3)
    expect(apiClient.get).toHaveBeenCalledWith('/exam/master/3/results/')
  })

  it('summaryCsvUrl returns a fully-qualified download URL', () => {
    const url = masterExamService.summaryCsvUrl(3)
    expect(url).toContain('/exam/master/3/results/summary.csv/')
    expect(url).toMatch(/^\/api\/v1/)
  })

  it('matrixCsvUrl returns a fully-qualified download URL', () => {
    const url = masterExamService.matrixCsvUrl(3)
    expect(url).toContain('/exam/master/3/results/matrix.csv/')
    expect(url).toMatch(/^\/api\/v1/)
  })
})

describe('masterExamService — drafts library', () => {
  it('draftsLibrary GETs the library URL with params', async () => {
    await masterExamService.draftsLibrary({ search: 'foo', usage: 'orphan' })
    expect(apiClient.get).toHaveBeenCalledWith('/exam/master/drafts/', {
      params: { search: 'foo', usage: 'orphan' },
    })
  })

  it('getDraft GETs the detail URL', async () => {
    await masterExamService.getDraft(9)
    expect(apiClient.get).toHaveBeenCalledWith('/exam/master/drafts/9/')
  })

  it('updateDraft PUTs the payload', async () => {
    await masterExamService.updateDraft(9, { question: 'Q' })
    expect(apiClient.put).toHaveBeenCalledWith('/exam/master/drafts/9/', {
      question: 'Q',
    })
  })

  it('deleteDraft DELETEs the detail URL', async () => {
    await masterExamService.deleteDraft(9)
    expect(apiClient.delete).toHaveBeenCalledWith('/exam/master/drafts/9/')
  })
})
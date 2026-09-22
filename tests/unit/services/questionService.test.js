// frontend/tests/unit/services/questionService.test.js
//
// Contract test for questionService.
//
// WHAT THIS FILE ASSERTS
// ----------------------
//   • Each method calls `apiClient` with the URL the backend
//     registers.
//   • Each method sends the exact wire payload the backend's
//     serializer expects.
//   • Each method uses the right HTTP verb — a GET that should be a
//     POST, or a POST that should be a PUT, is a bug that a shape
//     test on the URL alone would not catch.
//
// The mock boundary is `@/services/api/client`, not axios. That
// keeps the tests independent of axios behaviour, of the request
// interceptor, and of the response envelope unwrapping — all of
// which have their own test surface.

import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/services/api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

import { apiClient } from '@/services/api/client'
import { questionService } from '@/services/questionService'

beforeEach(() => {
  vi.clearAllMocks()
  // Every mocked method resolves to a benign shape. Individual
  // tests that care about the response can override with
  // `mockResolvedValueOnce`.
  apiClient.get.mockResolvedValue({})
  apiClient.post.mockResolvedValue({})
  apiClient.put.mockResolvedValue({})
  apiClient.delete.mockResolvedValue({})
})

describe('questionService contract', () => {
  // ── Repository base ────────────────────────────────────────────

  it('list issues a GET on the questions base with the given params', async () => {
    await questionService.list({ page: 2, per_page: 50 })

    expect(apiClient.get).toHaveBeenCalledWith(
      '/questions/',
      { params: { page: 2, per_page: 50 } },
    )
  })

  it('get issues a GET on the detail URL', async () => {
    await questionService.get(42)

    expect(apiClient.get).toHaveBeenCalledWith('/questions/42/')
  })

  it('create issues a POST on the base URL', async () => {
    const payload = { question: 'Q', choices: ['a', 'b'], correct_answer: 1 }
    await questionService.create(payload)

    expect(apiClient.post).toHaveBeenCalledWith('/questions/', payload)
  })

  it('update issues a PUT on the detail URL', async () => {
    const payload = { question: 'Q2' }
    await questionService.update(42, payload)

    expect(apiClient.put).toHaveBeenCalledWith('/questions/42/', payload)
  })

  it('delete issues a DELETE on the detail URL', async () => {
    await questionService.delete(42)

    expect(apiClient.delete).toHaveBeenCalledWith('/questions/42/', {})
  })

  // ── Verification ───────────────────────────────────────────────

  it('toggleVerify POSTs to the verify endpoint', async () => {
    await questionService.toggleVerify(42)

    expect(apiClient.post).toHaveBeenCalledWith('/questions/42/verify/')
  })

  it('bulkVerify sends the exact wire payload the backend expects', async () => {
    await questionService.bulkVerify([1, 2, 3], 'verify', 'looks good')

    expect(apiClient.post).toHaveBeenCalledWith(
      '/questions/bulk-verify/',
      {
        question_ids: [1, 2, 3],
        action: 'verify',
        verification_notes: 'looks good',
      },
    )
  })

  it('bulkUpdateTags sends add_tags and remove_tags separately', async () => {
    await questionService.bulkUpdateTags([1, 2], ['new'], ['old'])

    expect(apiClient.post).toHaveBeenCalledWith(
      '/questions/bulk-tags/',
      {
        question_ids: [1, 2],
        add_tags: ['new'],
        remove_tags: ['old'],
      },
    )
  })

  it('getUnverified passes params through to the list endpoint', async () => {
    await questionService.getUnverified({ page: 1, per_page: 20 })

    expect(apiClient.get).toHaveBeenCalledWith(
      '/questions/unverified/',
      { params: { page: 1, per_page: 20 } },
    )
  })

  // ── Batch / count ──────────────────────────────────────────────

  it('batch POSTs the id list under the `ids` key', async () => {
    await questionService.batch([4, 5, 6])

    expect(apiClient.post).toHaveBeenCalledWith(
      '/questions/batch/',
      { ids: [4, 5, 6] },
    )
  })

  it('availableCount passes its filter object as query params', async () => {
    await questionService.availableCount({ difficulty: 'easy', category_ids: '3,7' })

    expect(apiClient.get).toHaveBeenCalledWith(
      '/questions/available-count/',
      { params: { difficulty: 'easy', category_ids: '3,7' } },
    )
  })

  // ── Duplicate ──────────────────────────────────────────────────

  it('duplicate POSTs to the duplicate URL', async () => {
    await questionService.duplicate(42)

    expect(apiClient.post).toHaveBeenCalledWith('/questions/42/duplicate/')
  })

  // ── Ratings ────────────────────────────────────────────────────

  it('rateQuestion POSTs the rating value', async () => {
    await questionService.rateQuestion(42, 4)

    expect(apiClient.post).toHaveBeenCalledWith(
      '/questions/42/rate/',
      { rating: 4 },
    )
  })

  it('batchRatings joins the id list with commas and sends it as a query param', async () => {
    await questionService.batchRatings([7, 8, 9])

    expect(apiClient.get).toHaveBeenCalledWith(
      '/questions/ratings/',
      { params: { ids: '7,8,9' } },
    )
  })

  // ── Image upload ───────────────────────────────────────────────

  it('uploadImage with a file sends multipart FormData', async () => {
    const fakeFile = new File(['binary'], 'photo.png', { type: 'image/png' })

    await questionService.uploadImage(42, fakeFile)

    expect(apiClient.post).toHaveBeenCalledTimes(1)
    const [url, body, config] = apiClient.post.mock.calls[0]
    expect(url).toBe('/questions/42/image/')
    expect(body).toBeInstanceOf(FormData)
    expect(body.get('image')).toBe(fakeFile)
    expect(config).toEqual({ headers: { 'Content-Type': 'multipart/form-data' } })
  })

  it('uploadImage with no file sends a delete flag', async () => {
    await questionService.uploadImage(42, null)

    const [url, body] = apiClient.post.mock.calls[0]
    expect(url).toBe('/questions/42/image/')
    expect(body).toBeInstanceOf(FormData)
    expect(body.get('delete')).toBe('true')
  })

  // ── Study Now ──────────────────────────────────────────────────

  it('studyNow sends the limit as a query param', async () => {
    await questionService.studyNow(40)

    expect(apiClient.get).toHaveBeenCalledWith(
      '/questions/study-now/',
      { params: { limit: 40 } },
    )
  })

  // ── Case stem (regression guard) ───────────────────────────────
  //
  // The previous code referenced `ENDPOINTS.QUESTIONS.CASE_STEM`,
  // which is not defined. Because the constant was `undefined`,
  // calling it threw `TypeError: ENDPOINTS.QUESTIONS.CASE_STEM is
  // not a function` at this exact call site. The assertion below is
  // the contract that guards the fix.

  it('updateCaseStem POSTs to the case-stem endpoint', async () => {
    await questionService.updateCaseStem('case-foo', 'new vignette')

    expect(apiClient.post).toHaveBeenCalledWith(
      '/questions/case/case-foo/stem/',
      { case_stem: 'new vignette' },
    )
  })

  it('updateCaseStem URL-encodes the case key', async () => {
    await questionService.updateCaseStem('case with spaces', 'x')

    expect(apiClient.post).toHaveBeenCalledWith(
      '/questions/case/case%20with%20spaces/stem/',
      { case_stem: 'x' },
    )
  })
})
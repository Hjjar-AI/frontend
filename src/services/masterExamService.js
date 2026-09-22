// frontend/src/services/masterExamService.js
//
// MASTER EXAMS — API client.
//
// Thin wrapper over apiClient. Every method returns the unwrapped
// payload (see the response interceptor in api/client.js, which
// returns `body.data` for envelope-shaped responses), or throws the
// normalized error.
//
// The store (masterExamStore.js) handles loading/error state and
// caching; this module is stateless.
import { apiClient } from '@/services/api/client'
import { API_BASE, ENDPOINTS } from '@/services/api/endpoints'

const E = ENDPOINTS.MASTER_EXAMS

export const masterExamService = {

  // ── CRUD ──────────────────────────────────────────────────────────

  list(params = {}) {
    return apiClient.get(E.LIST, { params })
  },
  get(id) {
    return apiClient.get(E.DETAIL(id))
  },
  create(data) {
    return apiClient.post(E.LIST, data)
  },
  update(id, data) {
    return apiClient.put(E.DETAIL(id), data)
  },
  delete(id, deleteMode) {
    return apiClient.delete(E.DETAIL(id), { data: { delete_mode: deleteMode } })
  },

  // ── Composition ───────────────────────────────────────────────────

  addQuestions(id, questionIds) {
    return apiClient.post(E.ADD_QUESTIONS(id), { question_ids: questionIds })
  },
  removeQuestion(id, questionId) {
    return apiClient.post(E.REMOVE_QUESTION(id), { question_id: questionId })
  },
  reorder(id, questionIds) {
    return apiClient.post(E.REORDER(id), { question_ids: questionIds })
  },
  addDraft(id, draftPayload) {
    return apiClient.post(E.ADD_DRAFT(id), draftPayload)
  },

  // ── Lifecycle ─────────────────────────────────────────────────────

  publish(id) {
    return apiClient.post(E.PUBLISH(id))
  },
  cancel(id) {
    return apiClient.post(E.CANCEL(id))
  },
  publishToBank(id) {
    return apiClient.post(E.PUBLISH_TO_BANK(id))
  },
  acknowledge(id) {
    return apiClient.post(E.ACKNOWLEDGE(id))
  },
  needsAcknowledgement() {
    return apiClient.get(E.NEEDS_ACK)
  },

  // ── Attempt lifecycle ─────────────────────────────────────────────

  startAttempt(id, { preview = false } = {}) {
    return apiClient.post(E.START_ATTEMPT(id), { preview })
  },
  attemptStatus(id) {
    return apiClient.get(E.ATTEMPT_STATUS(id))
  },
  attemptQuestion(id) {
    return apiClient.get(E.ATTEMPT_QUESTION(id))
  },
  submitAnswer(id, { questionId, answer, confidence }) {
    return apiClient.post(E.ATTEMPT_ANSWER(id), {
      question_id: questionId,
      answer,
      confidence,
    })
  },
  gotoQuestion(id, questionId) {
    return apiClient.post(E.ATTEMPT_GOTO(id), { question_id: questionId })
  },
  finishAttempt(id) {
    return apiClient.post(E.ATTEMPT_FINISH(id))
  },
  flagQuestion(id, { questionId, reason = '' }) {
    return apiClient.post(E.ATTEMPT_FLAG(id), {
      question_id: questionId,
      reason,
    })
  },

  // ── Results ───────────────────────────────────────────────────────

  results(id) {
    return apiClient.get(E.RESULTS(id))
  },

  // Both CSV URL builders consume the shared, already-normalised
  // `API_BASE` from endpoints.js. The previous inline
  // `(import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(...)`
  // copy in each of these two methods has been removed; a deploy
  // that ships a trailing slash on `VITE_API_BASE_URL` no longer
  // produces `//` in either download URL, and a change to the
  // resolution rule lands in one place.
  summaryCsvUrl(id) {
    return `${API_BASE}${E.RESULTS_SUMMARY_CSV(id)}`
  },
  matrixCsvUrl(id) {
    return `${API_BASE}${E.RESULTS_MATRIX_CSV(id)}`
  },

  // ── Drafts library ────────────────────────────────────────────────

  draftsLibrary(params = {}) {
    return apiClient.get(E.DRAFTS_LIBRARY, { params })
  },
  getDraft(draftId) {
    return apiClient.get(E.DRAFT_DETAIL(draftId))
  },
  updateDraft(draftId, data) {
    return apiClient.put(E.DRAFT_DETAIL(draftId), data)
  },
  deleteDraft(draftId) {
    return apiClient.delete(E.DRAFT_DETAIL(draftId))
  },
}
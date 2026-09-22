// frontend/src/services/wrongAnswerService.js
//
// FEATURES #1 / #2 / #5 — client for the personal attempt-state
// endpoints.
import { apiClient } from '@/services/api/client'
import { ENDPOINTS } from '@/services/api/endpoints'

export const wrongAnswerService = {
  /** Wrong-answer notebook (feature #2) — paginated. */
  listMistakes(params = {}) {
    return apiClient.get(ENDPOINTS.QUESTIONS.MISTAKES, { params })
  },

  /** Fragile-correct notebook (feature #5) — paginated. */
  listFragile(params = {}) {
    return apiClient.get(ENDPOINTS.QUESTIONS.FRAGILE, { params })
  },

  /** Scalar counts for the dashboard. */
  summary() {
    return apiClient.get(ENDPOINTS.QUESTIONS.ATTEMPT_SUMMARY)
  },

  /** Just the SRS due count. */
  dueCount() {
    return apiClient.get(ENDPOINTS.QUESTIONS.SRS_DUE_COUNT)
  },
}
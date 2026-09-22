// frontend/src/services/caseService.js
//
// Client for the ClinicalCase endpoints.
//
// Cases are the shared clinical vignettes that group case-linked
// questions. The read paths drive the case picker in QuestionForm
// (a native <datalist> populated from list()). The stem write path
// replaces the vignette across every question in the case in a
// single backend transaction.
//
// The key is a human-readable string like "case-depression-01".
// Lookups by key are URL-encoded by the endpoints module.
import { apiClient } from '@/services/api/client'
import { ENDPOINTS } from '@/services/api/endpoints'

export const caseService = {
  /**
   * List cases for the picker autocomplete.
   *
   * @param {Object} [params]
   * @param {string} [params.search]  substring match on key or title
   * @param {number} [params.limit]   capped at 100 server-side
   * @returns {Promise<{ items: Array, total: number }>}
   */
  list(params = {}) {
    return apiClient.get(ENDPOINTS.QUESTIONS.CASES_LIST, { params })
  },

  /**
   * Fetch one case with its full question list embedded.
   *
   * @param {string} key
   */
  get(key) {
    return apiClient.get(ENDPOINTS.QUESTIONS.CASES_DETAIL(key))
  },

  /**
   * Replace the case's title. Permission is checked server-side.
   *
   * @param {string} key
   * @param {string|null} title
   */
  updateTitle(key, title) {
    return apiClient.put(ENDPOINTS.QUESTIONS.CASES_DETAIL(key), { title })
  },

  /**
   * Replace the shared vignette across every question in the case.
   * Runs in a single row write on the ClinicalCase — see the service
   * comment in backend/apps/questions/services/question_service.py.
   *
   * @param {string} key
   * @param {string|null} stem
   */
  updateStem(key, stem) {
    return apiClient.post(ENDPOINTS.QUESTIONS.CASES_STEM(key), {
      case_stem: stem,
    })
  },

  /**
   * Delete a case. The questions detach and become standalone.
   * Admin-only (server-side capability `questions.edit_case_stem_any`).
   *
   * @param {string} key
   */
  delete(key) {
    return apiClient.delete(ENDPOINTS.QUESTIONS.CASES_DETAIL(key))
  },
}
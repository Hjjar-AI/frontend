// frontend/src/services/flagService.js
//
// Client for the question-flag endpoints.
//
// CONSOLIDATION (first-review item 3)
// -----------------------------------
// `adminService` previously declared three flag methods that were
// byte-identical to the three here. The two services pointed at the
// same URLs, used the same HTTP verbs, and were called by different
// callers — the store used this service; the admin Flags.vue view
// used `adminService` directly for its bulk loop.
//
// The three methods have been removed from `adminService`. Every
// caller now goes through this service (via the store, or via
// `flagService.bulkResolve` below).
//
// The three methods here are the single source of truth for the flag
// endpoints. A change to a URL or payload key lands here once.

import { apiClient } from '@/services/api/client'
import { ENDPOINTS } from '@/services/api/endpoints'

export const flagService = {
  // User action: flag a question.
  flagQuestion(questionId, reason = '') {
    return apiClient.post(ENDPOINTS.QUESTIONS.FLAG(questionId), { reason })
  },

  // Admin: list pending flags.
  listPendingFlags(page = 1, perPage = 50) {
    return apiClient.get(ENDPOINTS.ADMIN.FLAGS, {
      params: { page, per_page: perPage },
    })
  },

  // Admin: resolve a flag.
  resolveFlag(flagId) {
    return apiClient.post(ENDPOINTS.ADMIN.FLAG_RESOLVE(flagId))
  },
}
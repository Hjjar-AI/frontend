// frontend/src/services/testHistoryService.js
import { apiClient } from '@/services/api/client'
import { ENDPOINTS } from '@/services/api/endpoints'

export const testHistoryService = {
  /**
   * Fetch session history.
   *
   * The two previous methods (`getMyHistory` → `/history/`,
   * `getAllHistory` → `/admin/history/`) both resolved to the same
   * `TestHistoryView` on the backend, which picks the result set from
   * the query params and the caller's capability:
   *
   *   • `user_id` provided — filter to that user. The view requires
   *     either `tests.view_all_history` OR `user_id == request.user.id`.
   *   • `user_id` missing  — with `tests.view_all_history`: every
   *     user's rows; without: only the caller's own rows.
   *
   * The two backend URL paths exist for namespace organisation, not
   * for behavior. We always hit `/history/` now; the capability
   * enforcement is unchanged because it happens server-side on the
   * caller, not on the URL path.
   *
   * `params` may carry:
   *   page        — 1-based page number
   *   per_page    — rows per page
   *   user_id     — restrict to one user (own-history callers)
   */
  fetchHistory(params = {}) {
    return apiClient.get(ENDPOINTS.HISTORY.BASE, { params })
  },
}
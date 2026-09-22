// frontend/src/services/analyticsService.js
//
// Thin wrapper over the analytics endpoints. Kept separate from the
// store so a caller that does not need pinia (a one-off script, a
// test) can hit the API without instantiating the store.
//
// Every method takes an optional `params` object; the backend
// validates and clamps each parameter, so the client can pass values
// through without re-validating.
//
// `verificationStats` USED TO BE DECLARED HERE AND ON adminService.
// The two methods were byte-identical — same URL, same verb, no
// caller differences — and the only consumer
// (`adminVerificationStatsStore.fetchStats`) imported `adminService`.
// The duplicate here was removed. If you later want the URL to live
// on `analyticsService` instead, move it rather than copy it: see
// the note at the bottom of this file.

import { apiClient } from '@/services/api/client'
import { ENDPOINTS } from '@/services/api/endpoints'

const A = ENDPOINTS.ANALYTICS

export const analyticsService = {
  // ── Existing ────────────────────────────────────────────────────
  summary(days = 30) {
    return apiClient.get(A.SUMMARY, { params: { days } })
  },

  activeUsers(days = 30) {
    return apiClient.get(A.ACTIVE_USERS, { params: { days } })
  },

  // `verificationStats()` is deliberately NOT declared here.
  //
  // The endpoint (`/analytics/verification-stats/`) is a single
  // server route, and it is consumed by exactly one store
  // (`adminVerificationStatsStore`), which reaches it through
  // `adminService.getVerificationStats()`. Declaring a second
  // identical method here was pure duplication with no caller.
  //
  // If a future caller genuinely needs to reach the endpoint
  // through `analyticsService` (for example because a non-admin
  // surface starts consuming it), move the method from
  // `adminService.js` to here in the same change rather than
  // re-adding a copy. See `frontend/src/services/adminService.js`
  // for the current single declaration.

  // ── Member-facing advanced ──────────────────────────────────────
  categoryMastery(params = {}) {
    return apiClient.get(A.CATEGORY_MASTERY, { params })
  },

  streakHistory(params = {}) {
    return apiClient.get(A.STREAK_HISTORY, { params })
  },

  // ── Admin advanced ──────────────────────────────────────────────
  difficultyCalibration() {
    return apiClient.get(A.ADMIN_DIFFICULTY_CALIBRATION)
  },

  authorFlagRate(params = {}) {
    return apiClient.get(A.ADMIN_AUTHOR_FLAG_RATE, { params })
  },

  examDuration(params = {}) {
    return apiClient.get(A.ADMIN_EXAM_DURATION, { params })
  },

  cohortComparison(params = {}) {
    return apiClient.get(A.ADMIN_COHORT_COMPARISON, { params })
  },

  weeklyRetention(params = {}) {
    return apiClient.get(A.ADMIN_WEEKLY_RETENTION, { params })
  },
}
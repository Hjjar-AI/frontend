// frontend/src/stores/analyticsStore.js
//
// Analytics store.
//
// State shape
// -----------
// • `summary` and `activeUsers` — the existing top-level view. Loaded
//   eagerly when the Analytics page mounts. These two do NOT go
//   through the report factory because their fetch signature is
//   different: they take a positional `days` argument and use the
//   store's top-level status/error keys, not a sub-resource pair.
//
// • Seven advanced reports. Each has its own data bucket and its own
//   status/error pair. Two (categoryMastery, streakHistory) are
//   member-facing and load eagerly alongside the summary; the other
//   five are admin reports loaded lazily when the user expands their
//   accordion section.
//
// Caching
// -------
// Each report's fetch action short-circuits when its bucket is
// non-null, unless `{ force: true }` is passed. See
// `reportFactory.makeReportFetcher` for the contract.


import { defineStore } from 'pinia'

import { analyticsService } from '@/services/analyticsService'
import { useCrudActions } from '@/composables/useCrudActions'
import {
  standardState,
  standardGetters,
  makeReset,
} from '@/stores/storeHelpers'
import {
  ANALYTICS_REPORT_NAMES,
  reportState,
  reportGetters,
  reportResetPayload,
  makeReportFetcher,
} from '@/stores/reportFactory'

export const useAnalyticsStore = defineStore('analytics', {
  state: () => standardState({
    // ── Top-level (existing) ──────────────────────────────────────
    summary: null,
    activeUsers: [],

    // ── Advanced reports (features 1, 3, 4-8) ─────────────────────
    //
    // Spread the seven report state slices. Each contributes the
    // data bucket plus the `<name>Status` / `<name>Error` pair.
    ...ANALYTICS_REPORT_NAMES.reduce(
      (acc, name) => Object.assign(acc, reportState(name)),
      {},
    ),
  }),

  getters: {
    ...standardGetters,

    // Sub-resource getters for every report: `isCategoryMasteryLoading`,
    // `categoryMasteryHasError`, etc.
    ...reportGetters(ANALYTICS_REPORT_NAMES),
  },

  actions: {
    // ═══════════════════════════════════════════════════════════════
    // Top-level (unchanged)
    // ═══════════════════════════════════════════════════════════════

    async fetchSummary(days = 30) {
      const { wrap } = useCrudActions(this)
      return await wrap(() => analyticsService.summary(days), {
        errorMsgFallbackKey: 'notifications.analyticsLoadFailed',
        onSuccess: (data) => { this.summary = data },
      })
    },

    async fetchActiveUsers(days = 30) {
      const { wrap } = useCrudActions(this)
      return await wrap(() => analyticsService.activeUsers(days), {
        errorMsgFallbackKey: 'notifications.activeUsersLoadFailed',
        onSuccess: (data) => { this.activeUsers = data },
      })
    },

    // ═══════════════════════════════════════════════════════════════
    // Advanced reports
    //
    // Each fetcher is built by the same factory. The only differences
    // between the seven are the report name and the service method;
    // `acceptsParams` is true for every report except the difficulty
    // calibration, whose backend endpoint takes no query params.
    // ═══════════════════════════════════════════════════════════════

    fetchCategoryMastery: makeReportFetcher({
      name: 'categoryMastery',
      serviceMethod: (params) => analyticsService.categoryMastery(params),
      acceptsParams: true,
    }),

    fetchStreakHistory: makeReportFetcher({
      name: 'streakHistory',
      serviceMethod: (params) => analyticsService.streakHistory(params),
      acceptsParams: true,
    }),

    fetchDifficultyCalibration: makeReportFetcher({
      name: 'difficultyCalibration',
      serviceMethod: () => analyticsService.difficultyCalibration(),
      acceptsParams: false,
    }),

    fetchAuthorFlagRate: makeReportFetcher({
      name: 'authorFlagRate',
      serviceMethod: (params) => analyticsService.authorFlagRate(params),
      acceptsParams: true,
    }),

    fetchExamDuration: makeReportFetcher({
      name: 'examDuration',
      serviceMethod: (params) => analyticsService.examDuration(params),
      acceptsParams: true,
    }),

    fetchCohortComparison: makeReportFetcher({
      name: 'cohortComparison',
      serviceMethod: (params) => analyticsService.cohortComparison(params),
      acceptsParams: true,
    }),

    fetchWeeklyRetention: makeReportFetcher({
      name: 'weeklyRetention',
      serviceMethod: (params) => analyticsService.weeklyRetention(params),
      acceptsParams: true,
    }),

    // ═══════════════════════════════════════════════════════════════
    // Reset
    // ═══════════════════════════════════════════════════════════════

    reset: makeReset({
      summary: null,
      activeUsers: [],

      ...reportResetPayload(ANALYTICS_REPORT_NAMES),

      status: 'idle',
      error: null,
    }),
  },
})
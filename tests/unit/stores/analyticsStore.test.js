// frontend/tests/unit/stores/analyticsStore.test.js
//
// Tests for the analytics store's per-report caching.
//
// The store has seven advanced reports, each with its own data
// bucket, status/error pair, and caching short-circuit. The pattern
// is duplicated across all seven, and it is the entire reason the
// store exists as a separate module — without the caching, the
// dashboard would re-fetch every accordion's data on every open.

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/services/analyticsService', () => ({
  analyticsService: {
    summary: vi.fn(),
    activeUsers: vi.fn(),
    categoryMastery: vi.fn(),
    streakHistory: vi.fn(),
    difficultyCalibration: vi.fn(),
    authorFlagRate: vi.fn(),
    examDuration: vi.fn(),
    cohortComparison: vi.fn(),
    weeklyRetention: vi.fn(),
  },
}))

import { analyticsService } from '@/services/analyticsService'
import { useAnalyticsStore } from '@/stores/analyticsStore'

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

// ── Top-level ──────────────────────────────────────────────────────

describe('analyticsStore — fetchSummary', () => {
  it('stores the summary', async () => {
    analyticsService.summary.mockResolvedValueOnce({ user_performance: [] })
    const store = useAnalyticsStore()
    await store.fetchSummary(30)
    expect(store.summary).toEqual({ user_performance: [] })
    expect(analyticsService.summary).toHaveBeenCalledWith(30)
  })
})

// ── Report caching ─────────────────────────────────────────────────

describe('analyticsStore — report caching', () => {
  it('fetches categoryMastery on first call', async () => {
    analyticsService.categoryMastery.mockResolvedValueOnce({ categories: [] })
    const store = useAnalyticsStore()
    await store.fetchCategoryMastery()
    expect(analyticsService.categoryMastery).toHaveBeenCalledTimes(1)
  })

  it('caches categoryMastery on subsequent calls without force', async () => {
    analyticsService.categoryMastery.mockResolvedValueOnce({ categories: [] })
    const store = useAnalyticsStore()
    await store.fetchCategoryMastery()
    await store.fetchCategoryMastery()
    await store.fetchCategoryMastery()
    expect(analyticsService.categoryMastery).toHaveBeenCalledTimes(1)
  })

  it('re-fetches with force: true', async () => {
    analyticsService.categoryMastery.mockResolvedValue({ categories: [] })
    const store = useAnalyticsStore()
    await store.fetchCategoryMastery()
    await store.fetchCategoryMastery({ force: true })
    expect(analyticsService.categoryMastery).toHaveBeenCalledTimes(2)
  })

  it('returns the cached value on the second call', async () => {
    analyticsService.categoryMastery.mockResolvedValueOnce({ categories: ['a'] })
    const store = useAnalyticsStore()
    const first = await store.fetchCategoryMastery()
    const second = await store.fetchCategoryMastery()
    expect(second).toEqual(first)
  })

  it('does not cache when the initial fetch returned null', async () => {
    analyticsService.categoryMastery.mockRejectedValueOnce({ message: 'fail' })
    const store = useAnalyticsStore()
    await store.fetchCategoryMastery()
    // The store's data bucket is still null, so a subsequent call
    // does not short-circuit.
    analyticsService.categoryMastery.mockResolvedValueOnce({ categories: [] })
    await store.fetchCategoryMastery()
    expect(analyticsService.categoryMastery).toHaveBeenCalledTimes(2)
  })
})

describe('analyticsStore — caching for every report', () => {
  // The caching short-circuit is duplicated across seven reports.
  // One test per report that proves the second call is a no-op.
  it.each([
    ['categoryMastery', 'fetchCategoryMastery', 'categoryMastery'],
    ['streakHistory', 'fetchStreakHistory', 'streakHistory'],
    ['difficultyCalibration', 'fetchDifficultyCalibration', 'difficultyCalibration'],
    ['authorFlagRate', 'fetchAuthorFlagRate', 'authorFlagRate'],
    ['examDuration', 'fetchExamDuration', 'examDuration'],
    ['cohortComparison', 'fetchCohortComparison', 'cohortComparison'],
    ['weeklyRetention', 'fetchWeeklyRetention', 'weeklyRetention'],
  ])('%s: second call is a cache hit', async (_label, action, serviceFn) => {
    analyticsService[serviceFn].mockResolvedValue({ rows: [] })
    const store = useAnalyticsStore()
    await store[action]()
    await store[action]()
    expect(analyticsService[serviceFn]).toHaveBeenCalledTimes(1)
  })
})

// ── Status and error bookkeeping ──────────────────────────────────

describe('analyticsStore — status/error bookkeeping', () => {
  it('sets the report status to error on failure', async () => {
    analyticsService.categoryMastery.mockRejectedValueOnce({ message: 'boom' })
    const store = useAnalyticsStore()
    await store.fetchCategoryMastery()
    expect(store.categoryMasteryStatus).toBe('error')
  })

  it('clears the report error on a successful re-fetch with force', async () => {
    analyticsService.categoryMastery.mockRejectedValueOnce({ message: 'boom' })
    const store = useAnalyticsStore()
    await store.fetchCategoryMastery()
    expect(store.categoryMasteryError).toBeTruthy()

    analyticsService.categoryMastery.mockResolvedValueOnce({ categories: [] })
    await store.fetchCategoryMastery({ force: true })
    expect(store.categoryMasteryError).toBeNull()
    expect(store.categoryMasteryStatus).toBe('success')
  })
})

// ── Reset ─────────────────────────────────────────────────────────

describe('analyticsStore — reset', () => {
  it('clears every data bucket', async () => {
    analyticsService.summary.mockResolvedValueOnce({ user_performance: [] })
    analyticsService.categoryMastery.mockResolvedValueOnce({ categories: [] })
    const store = useAnalyticsStore()
    await store.fetchSummary(30)
    await store.fetchCategoryMastery()
    store.reset()
    expect(store.summary).toBeNull()
    expect(store.categoryMastery).toBeNull()
  })
})
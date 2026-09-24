// frontend/tests/unit/services/analyticsService.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/services/api/client', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

import { apiClient } from '@/services/api/client'
import { analyticsService } from '@/services/analyticsService'
import { adminService } from '@/services/adminService'

beforeEach(() => { vi.clearAllMocks() })

describe('analyticsService — top-level', () => {
  it('summary GETs /analytics/summary/ with the days param', async () => {
    await analyticsService.summary(30)
    expect(apiClient.get).toHaveBeenCalledWith('/analytics/summary/', {
      params: { days: 30 },
    })
  })

  it('summary defaults to 30 days', async () => {
    await analyticsService.summary()
    expect(apiClient.get).toHaveBeenCalledWith('/analytics/summary/', {
      params: { days: 30 },
    })
  })

  it('activeUsers GETs /analytics/active-users/ with days', async () => {
    await analyticsService.activeUsers(7)
    expect(apiClient.get).toHaveBeenCalledWith('/analytics/active-users/', {
      params: { days: 7 },
    })
  })

  it('admin verification stats use the single admin-service endpoint', async () => {
    await adminService.getVerificationStats()
    expect(apiClient.get).toHaveBeenCalledWith('/analytics/verification-stats/')
  })
})

describe('analyticsService — member-facing advanced', () => {
  it('categoryMastery passes params through', async () => {
    await analyticsService.categoryMastery({ min_attempts: 3, top: 20 })
    expect(apiClient.get).toHaveBeenCalledWith('/analytics/category-mastery/', {
      params: { min_attempts: 3, top: 20 },
    })
  })

  it('streakHistory passes params through', async () => {
    await analyticsService.streakHistory({ days: 90 })
    expect(apiClient.get).toHaveBeenCalledWith('/analytics/streak-history/', {
      params: { days: 90 },
    })
  })
})

describe('analyticsService — admin advanced', () => {
  it('difficultyCalibration GETs the admin route', async () => {
    await analyticsService.difficultyCalibration()
    expect(apiClient.get).toHaveBeenCalledWith(
      '/analytics/admin/difficulty-calibration/',
    )
  })

  it('authorFlagRate passes params through', async () => {
    await analyticsService.authorFlagRate({ min_questions: 5, top: 10 })
    expect(apiClient.get).toHaveBeenCalledWith(
      '/analytics/admin/author-flag-rate/',
      { params: { min_questions: 5, top: 10 } },
    )
  })

  it('examDuration passes params through', async () => {
    await analyticsService.examDuration({ days: 30 })
    expect(apiClient.get).toHaveBeenCalledWith(
      '/analytics/admin/exam-duration/',
      { params: { days: 30 } },
    )
  })

  it('cohortComparison passes params through', async () => {
    await analyticsService.cohortComparison({ days: 7 })
    expect(apiClient.get).toHaveBeenCalledWith(
      '/analytics/admin/cohort-comparison/',
      { params: { days: 7 } },
    )
  })

  it('weeklyRetention passes params through', async () => {
    await analyticsService.weeklyRetention({ weeks: 12 })
    expect(apiClient.get).toHaveBeenCalledWith(
      '/analytics/admin/retention/',
      { params: { weeks: 12 } },
    )
  })
})

// frontend/tests/unit/services/groupService.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/services/api/client', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

import { apiClient } from '@/services/api/client'
import { groupService } from '@/services/groupService'

beforeEach(() => { vi.clearAllMocks() })

describe('groupService — member-facing', () => {
  it('mine GETs /study/groups/mine/', async () => {
    await groupService.mine()
    expect(apiClient.get).toHaveBeenCalledWith('/study/groups/mine/')
  })

  it('leaderboard defaults to 7 days', async () => {
    await groupService.leaderboard(5)
    expect(apiClient.get).toHaveBeenCalledWith('/study/groups/5/leaderboard/', {
      params: { days: 7 },
    })
  })

  it('leaderboard forwards a custom days value', async () => {
    await groupService.leaderboard(5, 30)
    expect(apiClient.get).toHaveBeenCalledWith('/study/groups/5/leaderboard/', {
      params: { days: 30 },
    })
  })

  it('setVisibility POSTs show_in_leaderboard', async () => {
    await groupService.setVisibility(5, false)
    expect(apiClient.post).toHaveBeenCalledWith('/study/groups/5/visibility/', {
      show_in_leaderboard: false,
    })
  })

  it('streak GETs /study/streak/', async () => {
    await groupService.streak()
    expect(apiClient.get).toHaveBeenCalledWith('/study/streak/')
  })

  it('activityHeatmap defaults to 365 days', async () => {
    await groupService.activityHeatmap()
    expect(apiClient.get).toHaveBeenCalledWith('/study/activity-heatmap/', {
      params: { days: 365 },
    })
  })

  it('activityHeatmap forwards a custom window', async () => {
    await groupService.activityHeatmap(90)
    expect(apiClient.get).toHaveBeenCalledWith('/study/activity-heatmap/', {
      params: { days: 90 },
    })
  })
})

describe('groupService — admin', () => {
  it('adminList omits include_inactive when false', async () => {
    await groupService.adminList()
    expect(apiClient.get).toHaveBeenCalledWith('/study/admin/groups/', {
      params: {},
    })
  })

  it('adminList sends include_inactive=true when requested', async () => {
    await groupService.adminList(true)
    expect(apiClient.get).toHaveBeenCalledWith('/study/admin/groups/', {
      params: { include_inactive: 'true' },
    })
  })

  it('adminGet GETs the detail URL', async () => {
    await groupService.adminGet(5)
    expect(apiClient.get).toHaveBeenCalledWith('/study/admin/groups/5/')
  })

  it('adminCreate POSTs the payload', async () => {
    await groupService.adminCreate({ name: 'A', description: 'B' })
    expect(apiClient.post).toHaveBeenCalledWith('/study/admin/groups/', {
      name: 'A',
      description: 'B',
    })
  })

  it('adminUpdate PUTs the payload', async () => {
    await groupService.adminUpdate(5, { name: 'X' })
    expect(apiClient.put).toHaveBeenCalledWith('/study/admin/groups/5/', {
      name: 'X',
    })
  })

  it('adminDelete DELETEs the detail URL', async () => {
    await groupService.adminDelete(5)
    expect(apiClient.delete).toHaveBeenCalledWith('/study/admin/groups/5/')
  })

  it('adminAddMembers POSTs user_ids array', async () => {
    await groupService.adminAddMembers(5, [1, 2, 3])
    expect(apiClient.post).toHaveBeenCalledWith(
      '/study/admin/groups/5/members/',
      { user_ids: [1, 2, 3] },
    )
  })

  it('adminRemoveMember DELETEs the nested URL', async () => {
    await groupService.adminRemoveMember(5, 42)
    expect(apiClient.delete).toHaveBeenCalledWith(
      '/study/admin/groups/5/members/42/',
    )
  })
})
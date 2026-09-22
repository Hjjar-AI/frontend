// frontend/tests/unit/stores/groupStore.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('@/services/groupService', () => ({
  groupService: {
    mine: vi.fn(),
    leaderboard: vi.fn(),
    setVisibility: vi.fn(),
    streak: vi.fn(),
    activityHeatmap: vi.fn(),
    adminList: vi.fn(),
    adminGet: vi.fn(),
    adminCreate: vi.fn(),
    adminUpdate: vi.fn(),
    adminDelete: vi.fn(),
    adminAddMembers: vi.fn(),
    adminRemoveMember: vi.fn(),
  },
}))

import { groupService } from '@/services/groupService'
import { useGroupStore } from '@/stores/groupStore'

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

describe('groupStore — fetchMyGroups', () => {
  it('populates myGroups', async () => {
    groupService.mine.mockResolvedValueOnce({
      items: [{ id: 1, name: 'Alpha' }, { id: 2, name: 'Beta' }],
    })
    const store = useGroupStore()
    await store.fetchMyGroups()
    expect(store.myGroups).toHaveLength(2)
  })
})

describe('groupStore — fetchLeaderboard', () => {
  it('stores the leaderboard keyed by groupId', async () => {
    groupService.leaderboard.mockResolvedValueOnce({
      group: { id: 1, name: 'Alpha' },
      days: 7,
      rows: [{ user_id: 1, rank: 1 }],
    })
    const store = useGroupStore()
    await store.fetchLeaderboard(1, 7)
    expect(store.leaderboards[1]).toBeTruthy()
    expect(store.leaderboards[1].rows).toHaveLength(1)
  })

  it('passes the days window to the service', async () => {
    groupService.leaderboard.mockResolvedValueOnce({ rows: [] })
    const store = useGroupStore()
    await store.fetchLeaderboard(1, 30)
    expect(groupService.leaderboard).toHaveBeenCalledWith(1, 30)
  })
})

describe('groupStore — setVisibility', () => {
  it('posts the new flag to the service', async () => {
    groupService.setVisibility.mockResolvedValueOnce({})
    const store = useGroupStore()
    await store.setVisibility(1, false)
    expect(groupService.setVisibility).toHaveBeenCalledWith(1, false)
  })
})

describe('groupStore — fetchStreak', () => {
  it('stores the streak payload', async () => {
    groupService.streak.mockResolvedValueOnce({
      current_streak: 5,
      longest_streak: 12,
      last_study_date: '2026-01-01',
    })
    const store = useGroupStore()
    await store.fetchStreak()
    expect(store.streak.current_streak).toBe(5)
    expect(store.currentStreak).toBe(5)
    expect(store.longestStreak).toBe(12)
  })

  it('suppresses the error toast on failure', async () => {
    groupService.streak.mockRejectedValueOnce({ message: 'fail' })
    const store = useGroupStore()
    await store.fetchStreak()
    // The store did not throw, and the streak remains the default.
    expect(store.streak.current_streak).toBe(0)
  })
})

describe('groupStore — fetchHeatmap', () => {
  it('stores the heatmap payload', async () => {
    groupService.activityHeatmap.mockResolvedValueOnce({
      days: [{ date: '2026-01-01', count: 3 }],
      total_questions: 3,
      active_days: 1,
      max_daily: 3,
    })
    const store = useGroupStore()
    await store.fetchHeatmap(365)
    expect(store.heatmap.total_questions).toBe(3)
    expect(store.hasHeatmap).toBe(true)
  })

  it('defaults to a one-year window', async () => {
    groupService.activityHeatmap.mockResolvedValueOnce({ days: [] })
    const store = useGroupStore()
    await store.fetchHeatmap()
    expect(groupService.activityHeatmap).toHaveBeenCalledWith(365)
  })
})

describe('groupStore — admin CRUD', () => {
  it('fetchAdminGroups populates the admin list', async () => {
    groupService.adminList.mockResolvedValueOnce({
      items: [{ id: 1, name: 'A', member_count: 3 }],
    })
    const store = useGroupStore()
    await store.fetchAdminGroups()
    expect(store.adminGroups).toHaveLength(1)
  })

  it('fetchAdminGroup stores the detail', async () => {
    groupService.adminGet.mockResolvedValueOnce({ id: 1, name: 'A', members: [] })
    const store = useGroupStore()
    await store.fetchAdminGroup(1)
    expect(store.adminCurrent.name).toBe('A')
  })

  it('createGroup prepends the new group', async () => {
    groupService.adminCreate.mockResolvedValueOnce({ id: 9, name: 'New' })
    const store = useGroupStore()
    store.adminGroups = [{ id: 1 }]
    await store.createGroup({ name: 'New' })
    expect(store.adminGroups[0].id).toBe(9)
  })

  it('updateGroup replaces the matching row', async () => {
    groupService.adminUpdate.mockResolvedValueOnce({ id: 1, name: 'Renamed' })
    const store = useGroupStore()
    store.adminGroups = [{ id: 1, name: 'Old' }]
    store.adminCurrent = { id: 1, name: 'Old' }
    await store.updateGroup(1, { name: 'Renamed' })
    expect(store.adminGroups[0].name).toBe('Renamed')
    expect(store.adminCurrent.name).toBe('Renamed')
  })

  it('deleteGroup drops the row', async () => {
    groupService.adminDelete.mockResolvedValueOnce({})
    const store = useGroupStore()
    store.adminGroups = [{ id: 1 }, { id: 2 }]
    store.adminCurrent = { id: 1 }
    await store.deleteGroup(1)
    expect(store.adminGroups.map(g => g.id)).toEqual([2])
    expect(store.adminCurrent).toBeNull()
  })

  it('addMembers delegates to the service and refetches the group', async () => {
    groupService.adminAddMembers.mockResolvedValueOnce({})
    groupService.adminGet.mockResolvedValueOnce({ id: 1, members: [] })
    const store = useGroupStore()
    await store.addMembers(1, [10, 11])
    expect(groupService.adminAddMembers).toHaveBeenCalledWith(1, [10, 11])
    expect(groupService.adminGet).toHaveBeenCalledWith(1)
  })

  it('removeMember delegates to the service and refetches the group', async () => {
    groupService.adminRemoveMember.mockResolvedValueOnce({})
    groupService.adminGet.mockResolvedValueOnce({ id: 1, members: [] })
    const store = useGroupStore()
    await store.removeMember(1, 10)
    expect(groupService.adminRemoveMember).toHaveBeenCalledWith(1, 10)
    expect(groupService.adminGet).toHaveBeenCalledWith(1)
  })
})

describe('groupStore — reset', () => {
  it('clears every field', () => {
    const store = useGroupStore()
    store.myGroups = [{ id: 1 }]
    store.adminGroups = [{ id: 1 }]
    store.leaderboards = { 1: { rows: [] } }
    store.heatmap = { days: [] }
    store.reset()
    expect(store.myGroups).toEqual([])
    expect(store.adminGroups).toEqual([])
    expect(store.leaderboards).toEqual({})
    expect(store.heatmap).toBeNull()
  })
})
// frontend/src/services/groupService.js
//
// FEATURE #9 — client for the group + leaderboard endpoints.
// FEATURE #10 — added activityHeatmap().
import { apiClient } from '@/services/api/client'
import { ENDPOINTS } from '@/services/api/endpoints'

export const groupService = {
  // ── Member-facing ─────────────────────────────────────────────────
  mine() {
    return apiClient.get(ENDPOINTS.GROUPS.MINE)
  },

  leaderboard(groupId, days = 7) {
    return apiClient.get(ENDPOINTS.GROUPS.LEADERBOARD(groupId), { params: { days } })
  },

  setVisibility(groupId, showInLeaderboard) {
    return apiClient.post(ENDPOINTS.GROUPS.VISIBILITY(groupId), {
      show_in_leaderboard: showInLeaderboard,
    })
  },

  streak() {
    return apiClient.get(ENDPOINTS.STREAK)
  },

  // ── FEATURE #10 — activity heatmap ───────────────────────────────
  activityHeatmap(days = 365) {
    return apiClient.get(ENDPOINTS.ACTIVITY_HEATMAP, { params: { days } })
  },

  // ── Admin ─────────────────────────────────────────────────────────
  adminList(includeInactive = false) {
    return apiClient.get(ENDPOINTS.GROUPS.ADMIN_LIST, {
      params: includeInactive ? { include_inactive: 'true' } : {},
    })
  },

  adminGet(id) {
    return apiClient.get(ENDPOINTS.GROUPS.ADMIN_DETAIL(id))
  },

  adminCreate(data) {
    return apiClient.post(ENDPOINTS.GROUPS.ADMIN_LIST, data)
  },

  adminUpdate(id, data) {
    return apiClient.put(ENDPOINTS.GROUPS.ADMIN_DETAIL(id), data)
  },

  adminDelete(id) {
    return apiClient.delete(ENDPOINTS.GROUPS.ADMIN_DETAIL(id))
  },

  adminAddMembers(id, userIds) {
    return apiClient.post(ENDPOINTS.GROUPS.ADMIN_MEMBERS(id), { user_ids: userIds })
  },

  adminRemoveMember(id, userId) {
    return apiClient.delete(ENDPOINTS.GROUPS.ADMIN_MEMBER(id, userId))
  },
}
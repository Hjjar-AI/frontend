// frontend/src/stores/groupStore.js
import { defineStore } from 'pinia'
import { groupService } from '@/services/groupService'
import { useCrudActions } from '@/composables/useCrudActions'
import { standardState, standardGetters, makeReset } from '@/stores/storeHelpers'

export const useGroupStore = defineStore('groups', {
  state: () => standardState({
    myGroups: [],
    adminGroups: [],
    adminCurrent: null,
    leaderboards: {},
    streak: { current_streak: 0, longest_streak: 0, last_study_date: null },
    // ── FEATURE #10 — activity heatmap ─────────────────────────────
    heatmap: null,


    visibilityByGroupId: {},
  }),

  getters: {
    ...standardGetters,
    myGroupCount: (state) => state.myGroups.length,
    currentStreak: (state) => state.streak.current_streak || 0,
    longestStreak: (state) => state.streak.longest_streak || 0,
    hasHeatmap: (state) => !!state.heatmap,

    // Convenience accessor used by MyGroups.vue. Returns `true` when
    // the map has no entry for the group — matching the default-
    // visible behaviour the store uses when populating the map.
    isGroupVisible: (state) => (groupId) => {
      return state.visibilityByGroupId[groupId] !== false
    },
  },

  actions: {
    async fetchMyGroups() {
      const { wrap } = useCrudActions(this)
      return await wrap(() => groupService.mine(), {
        errorMsgFallbackKey: 'notifications.groupsLoadFailed',
        onSuccess: (res) => {
          this.myGroups = res.items || []

          // Populate visibilityByGroupId from the payload. Only
          // `show_in_leaderboard` — the same key the write path
          // sends — is consulted. A group that does not carry the
          // field keeps whatever value it already had (or the
          // default-visible fallback).
          const visibility = { ...this.visibilityByGroupId }
          for (const group of this.myGroups) {
            if (typeof group.show_in_leaderboard === 'boolean') {
              visibility[group.id] = group.show_in_leaderboard
            } else if (!(group.id in visibility)) {
              visibility[group.id] = true
            }
          }
          this.visibilityByGroupId = visibility
        },
      })
    },

    async fetchLeaderboard(groupId, days = 7) {
      const { wrap } = useCrudActions(this)
      return await wrap(() => groupService.leaderboard(groupId, days), {
        errorMsgFallbackKey: 'notifications.groupLeaderboardLoadFailed',
        onSuccess: (data) => {
          this.leaderboards = { ...this.leaderboards, [groupId]: data }
        },
      })
    },

    async setVisibility(groupId, showInLeaderboard) {
      const { wrap } = useCrudActions(this)
      return await wrap(() => groupService.setVisibility(groupId, showInLeaderboard), {
        successMsgKey: showInLeaderboard
          ? 'notifications.visibilityShown'
          : 'notifications.visibilityHidden',
        errorMsgFallbackKey: 'notifications.groupVisibilityFailed',
        onSuccess: () => {
          // Mirror the server state locally so the checkbox reflects
          // the change without a full re-fetch. If the server ever
          // rejects a visibility change but returns 200, this is
          // where the local view would drift — that mismatch would
          // be a backend contract issue, not a client one.
          this.visibilityByGroupId = {
            ...this.visibilityByGroupId,
            [groupId]: showInLeaderboard,
          }
        },
      })
    },

    async fetchStreak() {
      const { wrap } = useCrudActions(this)
      return await wrap(() => groupService.streak(), {
        errorMsgFallbackKey: 'notifications.groupStreakLoadFailed',
        suppressErrorToast: true,
        onSuccess: (data) => {
          this.streak = data
        },
      })
    },

    // ── FEATURE #10 — activity heatmap ─────────────────────────────
    async fetchHeatmap(days = 365) {
      const { wrap } = useCrudActions(this)
      return await wrap(() => groupService.activityHeatmap(days), {
        errorMsgFallbackKey: 'notifications.heatmapLoadFailed',
        suppressErrorToast: true,
        onSuccess: (data) => {
          this.heatmap = data
        },
      })
    },

    async fetchAdminGroups(includeInactive = false) {
      const { wrap } = useCrudActions(this)
      return await wrap(() => groupService.adminList(includeInactive), {
        errorMsgFallbackKey: 'notifications.groupsLoadFailed',
        onSuccess: (res) => {
          this.adminGroups = res.items || []
        },
      })
    },

    async fetchAdminGroup(id) {
      const { wrap } = useCrudActions(this)
      return await wrap(() => groupService.adminGet(id), {
        errorMsgFallbackKey: 'notifications.groupLoadFailed',
        onSuccess: (data) => {
          this.adminCurrent = data
        },
      })
    },

    async createGroup(data) {
      const { wrap } = useCrudActions(this)
      return await wrap(() => groupService.adminCreate(data), {
        successMsgKey: 'notifications.groupCreated',
        errorMsgFallbackKey: 'notifications.groupCreateFailed',
        onSuccess: (group) => {
          this.adminGroups = [group, ...this.adminGroups]
        },
      })
    },

    async updateGroup(id, data) {
      const { wrap } = useCrudActions(this)
      return await wrap(() => groupService.adminUpdate(id, data), {
        successMsgKey: 'notifications.groupUpdated',
        errorMsgFallbackKey: 'notifications.groupUpdateFailed',
        onSuccess: (group) => {
          const idx = this.adminGroups.findIndex(g => g.id === id)
          if (idx !== -1) this.adminGroups.splice(idx, 1, group)
          if (this.adminCurrent?.id === id) this.adminCurrent = group
        },
      })
    },

    async deleteGroup(id) {
      const { wrap } = useCrudActions(this)
      return await wrap(() => groupService.adminDelete(id), {
        successMsgKey: 'notifications.groupDeleted',
        errorMsgFallbackKey: 'notifications.groupDeleteFailed',
        onSuccess: () => {
          this.adminGroups = this.adminGroups.filter(g => g.id !== id)
          if (this.adminCurrent?.id === id) this.adminCurrent = null
        },
      })
    },

    async addMembers(groupId, userIds) {
      const { wrap } = useCrudActions(this)
      return await wrap(() => groupService.adminAddMembers(groupId, userIds), {
        errorMsgFallbackKey: 'notifications.groupMemberAddFailed',
        onSuccess: () => {
          return this.fetchAdminGroup(groupId)
        },
      })
    },

    async removeMember(groupId, userId) {
      const { wrap } = useCrudActions(this)
      return await wrap(() => groupService.adminRemoveMember(groupId, userId), {
        successMsgKey: 'notifications.groupMemberRemoved',
        errorMsgFallbackKey: 'notifications.groupMemberRemoveFailed',
        onSuccess: () => {
          return this.fetchAdminGroup(groupId)
        },
      })
    },

    reset: makeReset({
      myGroups: [],
      adminGroups: [],
      adminCurrent: null,
      leaderboards: {},
      streak: { current_streak: 0, longest_streak: 0, last_study_date: null },
      heatmap: null,
      visibilityByGroupId: {},
      status: 'idle',
      error: null,
    }),
  },
})
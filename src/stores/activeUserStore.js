// frontend/src/stores/activeUserStore.js
import { defineStore } from 'pinia'
import { adminService } from '@/services/adminService'
import { useCrudActions } from '@/composables/useCrudActions'
import { standardState, standardGetters, makeReset } from '@/stores/storeHelpers'

export const useActiveUserStore = defineStore('activeUsers', {
  state: () => standardState({ users: [], lastUpdated: null }),
  getters: {
    ...standardGetters,
    count: (state) => state.users.length,
  },
  actions: {
    async fetchActiveUsers() {
      const { wrap } = useCrudActions(this)
      return await wrap(() => adminService.getActiveUsers(), {
        successMsg: null,
        errorMsgFallbackKey: 'notifications.activeUsersLoadFailed',
        onSuccess: (res) => {
          // Backend returns an object keyed by user ID: { "1": {name, ip...}, "2": {...} }
          // Object.entries preserves the ID so Vue keys and logic work correctly.
          const usersObj = res.users || {}
          this.users = Object.entries(usersObj).map(([id, u]) => ({ id: Number(id), ...u }))
          this.lastUpdated = new Date()
        },
      })
    },
    reset: makeReset({ users: [], lastUpdated: null, status: 'idle', error: null }),
  },
})
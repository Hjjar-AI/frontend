// frontend/src/stores/adminVerificationStatsStore.js
import { defineStore } from 'pinia'
import { adminService } from '@/services/adminService'
import { useCrudActions } from '@/composables/useCrudActions'
import { standardState, standardGetters, makeReset } from '@/stores/storeHelpers'

export const useAdminVerificationStatsStore = defineStore('adminVerificationStats', {
  state: () => standardState({ stats: null }),
  getters: {
    ...standardGetters,
  },
  actions: {
    async fetchStats() {
      return await useCrudActions(this).wrap(() => adminService.getVerificationStats(), {
        errorMsgFallbackKey: 'notifications.verificationStatsLoadFailed',
        onSuccess: (data) => { this.stats = data },
      })
    },
    reset: makeReset({ stats: null, status: 'idle', error: null }),
  },
})
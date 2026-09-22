// frontend/src/stores/flagStore.js
import { defineStore } from 'pinia'
import { flagService } from '@/services/flagService'
import { useCrudActions } from '@/composables/useCrudActions'
import { standardState, standardGetters, makeReset } from '@/stores/storeHelpers'

export const useFlagStore = defineStore('flags', {
  state: () => standardState({
    flags: [],
    pagination: { page: 1, per_page: 50, total: 0 },
    initialized: false,
  }),
  getters: {
    ...standardGetters,
    pendingCount: (state) => state.pagination.total || state.flags.length,
  },
  actions: {
    async fetchPending(page = 1, perPage = 50) {
      const { wrap } = useCrudActions(this)
      return await wrap(() => flagService.listPendingFlags(page, perPage), {
        successMsg: null,
        errorMsgFallbackKey: 'notifications.flagsLoadFailed',
        onSuccess: (res) => {
          this.flags = res.items || []
          this.pagination = { page: res.page || 1, per_page: res.per_page || 50, total: res.total || 0 }
          this.initialized = true
        },
      })
    },

    async ensureLoaded() {
      if (this.initialized) return
      return this.fetchPending()
    },

    async resolveFlag(flagId) {
      const { wrap } = useCrudActions(this)
      return await wrap(() => flagService.resolveFlag(flagId), {
        successMsgKey: 'notifications.flagResolved',
        errorMsgFallbackKey: 'notifications.flagResolveFailed',
        onSuccess: () => {
          this.flags = this.flags.filter(f => f.id !== flagId)
          this.pagination.total = Math.max(0, this.pagination.total - 1)
        },
      })
    },

    async bulkResolve(flagIds) {
      let resolved = 0
      let failed = 0
      for (const id of flagIds) {
        try {
          await flagService.resolveFlag(id)
          resolved++
        } catch {
          failed++
        }
      }
      await this.fetchPending()
      return { resolved, failed }
    },

    async flagQuestion(questionId, reason = '') {
      const { wrap } = useCrudActions(this)
      return await wrap(() => flagService.flagQuestion(questionId, reason), {
        successMsgKey: 'notifications.flagCreated',
        errorMsgFallbackKey: 'notifications.flagCreateFailed',
      })
    },

    reset: makeReset({
      flags: [],
      pagination: { page: 1, per_page: 50, total: 0 },
      initialized: false,
      status: 'idle',
      error: null,
    }),
  },
})
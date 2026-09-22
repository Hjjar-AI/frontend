import { defineStore } from 'pinia'
import { caseService } from '@/services/caseService'
import { useCrudActions } from '@/composables/useCrudActions'
import { standardState, standardGetters, makeReset } from '@/stores/storeHelpers'

export const useCaseStore = defineStore('cases', {
  state: () => standardState({ items: [], total: 0 }),

  getters: {
    ...standardGetters,
  },

  actions: {
    async fetchList(params = {}) {
      return await useCrudActions(this).wrap(() => caseService.list(params), {
        suppressErrorToast: true,
        onSuccess: (res) => {
          this.items = res?.items || []
          this.total = res?.total ?? this.items.length
        },
      })
    },

    reset: makeReset({ items: [], total: 0, status: 'idle', error: null }),
  },
})

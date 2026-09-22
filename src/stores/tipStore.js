import { defineStore } from 'pinia'
import { tipService } from '@/services/tipService'
import { useCrudActions } from '@/composables/useCrudActions'
import { standardState, standardGetters, makeReset } from '@/stores/storeHelpers'

export const useTipStore = defineStore('tips', {
  state: () => standardState({ itemsByLocale: {} }),

  getters: {
    ...standardGetters,
    forLocale: (state) => (locale) => state.itemsByLocale[locale] || [],
  },

  actions: {
    async fetchForLocale(locale) {
      return await useCrudActions(this).wrap(() => tipService.getTips(locale), {
        suppressErrorToast: true,
        onSuccess: (res) => {
          const items = Array.isArray(res?.tips) ? res.tips.filter(Boolean) : []
          this.itemsByLocale = { ...this.itemsByLocale, [locale]: items }
        },
      })
    },

    reset: makeReset({ itemsByLocale: {}, status: 'idle', error: null }),
  },
})

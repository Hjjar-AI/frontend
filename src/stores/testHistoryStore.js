// frontend/src/stores/testHistoryStore.js
import { defineStore } from 'pinia'
import { testHistoryService } from '@/services/testHistoryService'
import { useCrudActions } from '@/composables/useCrudActions'
import { standardState, standardGetters, makeReset } from '@/stores/storeHelpers'

export const useTestHistoryStore = defineStore('testHistory', {
  state: () => standardState({
    items: [],
    pagination: { page: 1, per_page: 20, total: 0, total_pages: 1 },
  }),
  getters: {
    ...standardGetters,
  },
  actions: {
    /**
     * Fetch a page of session history.
     *
     * The two former methods (`fetchMyHistory`, `fetchAllHistory`)
     * differed only in which query param they sent — and only
     * cosmetically, since both backend routes resolved to the same
     * view. This method preserves both behaviours through the
     * `userId` argument:
     *
     *   • userId provided → own-history query. Backend restricts to
     *     that user (requires either `tests.view_all_history` OR
     *     `userId === request.user.id`).
     *   • userId omitted  → all-history query. Backend returns every
     *     user's rows when the caller holds `tests.view_all_history`,
     *     otherwise only the caller's rows (which is what an
     *     unprivileged caller would see anyway).
     */
    async fetchHistory({ userId = null, ...rest } = {}) {
      const { wrap } = useCrudActions(this)

      const params = { ...rest }
      if (userId != null) {
        params.user_id = userId
      }

      return await wrap(() => testHistoryService.fetchHistory(params), {
        errorMsgFallbackKey: 'notifications.testHistoryMyLoadFailed',
        onSuccess: (res) => {
          this.items = res.items || []
          if (res.total !== undefined) {
            this.pagination = {
              page: res.page || 1,
              per_page: res.per_page || 20,
              total: res.total || 0,
              total_pages: res.total_pages || 1,
            }
          }
        },
      })
    },

    reset: makeReset({
      items: [],
      pagination: { page: 1, per_page: 20, total: 0, total_pages: 1 },
      status: 'idle',
      error: null,
    }),
  },
})
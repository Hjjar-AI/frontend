// frontend/src/stores/categoryStore.js
import { defineStore } from 'pinia'
import { categoryService } from '@/services/categoryService'
import { useCrudActions } from '@/composables/useCrudActions'
import { standardState, standardGetters, makeReset } from '@/stores/storeHelpers'

// Backend paginate() clamps per_page to 500 (see apps/core/utils.py).
// Requesting 1000 caused the store's local `pagination.per_page` to
// record 1000 while the server returned at most 500 rows.
const MAX_PER_PAGE = 500

export const useCategoryStore = defineStore('categories', {
  state: () => standardState({
    byId: {},
    ids: [],
    currentItem: null,
    pagination: { page: 1, per_page: MAX_PER_PAGE, total: 0, total_pages: 1 },
  }),
  getters: {
    ...standardGetters,
    items: (state) => state.ids.map(id => state.byId[id]),
    hasItems: (state) => state.ids.length > 0,
    isEmpty: (state) => state.ids.length === 0 && state.status !== 'loading',
  },
  actions: {
    async fetchAll() {
      const { wrap } = useCrudActions(this)
      return await wrap(() => categoryService.list({ per_page: MAX_PER_PAGE }), {
        onSuccess: (response) => {
          const items = response.items || []
          const newById = { ...this.byId }
          for (const item of items) newById[item.id] = { ...newById[item.id], ...item }
          this.byId = newById
          this.ids = items.map(i => i.id)
          if (response.total !== undefined) {
            this.pagination = {
              page: response.page || 1,
              per_page: response.per_page || MAX_PER_PAGE,
              total: response.total || 0,
              total_pages: response.total_pages || 1,
            }
          }
        },
        errorMsgFallbackKey: 'notifications.categoriesLoadFailed',
      })
    },
    async create(data) {
      const { wrap } = useCrudActions(this)
      return await wrap(() => categoryService.create(data), {
        successMsgKey: 'notifications.categoryCreated',
        onSuccess: (item) => {
          const newById = { ...this.byId }
          newById[item.id] = item
          this.byId = newById
          this.ids = [item.id, ...this.ids]
        },
        errorMsgFallbackKey: 'notifications.categoryCreateFailed',
      })
    },
    async update(id, data) {
      const { wrap } = useCrudActions(this)
      return await wrap(() => categoryService.update(id, data), {
        successMsgKey: 'notifications.categoryUpdated',
        onSuccess: (item) => {
          const newById = { ...this.byId }
          newById[id] = item
          this.byId = newById
          if (this.currentItem?.id === id) this.currentItem = item
        },
        errorMsgFallbackKey: 'notifications.categoryUpdateFailed',
      })
    },
    async remove(id) {
      const { wrap } = useCrudActions(this)
      return await wrap(() => categoryService.delete(id), {
        successMsgKey: 'notifications.categoryDeleted',
        onSuccess: () => {
          const newById = { ...this.byId }
          delete newById[id]
          this.byId = newById
          this.ids = this.ids.filter(i => i !== id)
          if (this.currentItem?.id === id) this.currentItem = null
        },
        errorMsgFallbackKey: 'notifications.categoryDeleteFailed',
      })
    },
    reset: makeReset({
      byId: {},
      ids: [],
      currentItem: null,
      pagination: { page: 1, per_page: MAX_PER_PAGE, total: 0, total_pages: 1 },
      status: 'idle',
      error: null,
    }),
  },
})
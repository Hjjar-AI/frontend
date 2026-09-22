// frontend/src/stores/blueprintStore.js
//
// The blueprint store is a thin pass-through: the server emits
// `weights` as a `{category_id: float}` dict on read (see
// BlueprintSerializer.to_representation in the backend), so the
// store does not need to know the on-disk representation changed
// from a JSONField to a through-model. The wire shape is preserved.
//
// This file is included in the frontend batch as documentation for
// that invariant. Its behavior is unchanged; the comment makes the
// contract explicit so a future reader does not "fix" the store to
// expect a `weight_entries` array.
import { defineStore } from 'pinia'
import { blueprintService } from '@/services/blueprintService'
import { useCrudActions } from '@/composables/useCrudActions'
import { standardState, standardGetters, makeReset } from '@/stores/storeHelpers'

export const useBlueprintStore = defineStore('blueprints', {
  state: () => standardState({
    items: [],
    currentItem: null,
  }),
  getters: {
    ...standardGetters,
    activeBlueprints: (state) => state.items.filter(b => b.is_active),
  },
  actions: {
    async fetchAll() {
      const { wrap } = useCrudActions(this)
      return await wrap(() => blueprintService.list(), {
        errorMsgFallbackKey: 'notifications.blueprintsLoadFailed',
        onSuccess: (res) => {
          // `res.items` is a list of blueprints, each with a flat
          // `weights` dict keyed on category id (as a string).
          this.items = res.items || []
        },
      })
    },

    async fetchOne(id) {
      const { wrap } = useCrudActions(this)
      return await wrap(() => blueprintService.get(id), {
        errorMsgFallbackKey: 'notifications.blueprintLoadFailed',
        onSuccess: (data) => {
          this.currentItem = data
        },
      })
    },

    async create(data) {
      const { wrap } = useCrudActions(this)
      return await wrap(() => blueprintService.create(data), {
        successMsgKey: 'notifications.blueprintCreated',
        errorMsgFallbackKey: 'notifications.blueprintCreateFailed',
        onSuccess: (blueprint) => {
          this.items = [blueprint, ...this.items]
        },
      })
    },

    async update(id, data) {
      const { wrap } = useCrudActions(this)
      return await wrap(() => blueprintService.update(id, data), {
        successMsgKey: 'notifications.blueprintUpdated',
        errorMsgFallbackKey: 'notifications.blueprintUpdateFailed',
        onSuccess: (blueprint) => {
          const idx = this.items.findIndex(b => b.id === id)
          if (idx !== -1) this.items.splice(idx, 1, blueprint)
          if (this.currentItem?.id === id) this.currentItem = blueprint
        },
      })
    },

    async remove(id) {
      const { wrap } = useCrudActions(this)
      return await wrap(() => blueprintService.delete(id), {
        successMsgKey: 'notifications.blueprintDeleted',
        errorMsgFallbackKey: 'notifications.blueprintDeleteFailed',
        onSuccess: () => {
          this.items = this.items.filter(b => b.id !== id)
          if (this.currentItem?.id === id) this.currentItem = null
        },
      })
    },

    reset: makeReset({
      items: [],
      currentItem: null,
      status: 'idle',
      error: null,
    }),
  },
})
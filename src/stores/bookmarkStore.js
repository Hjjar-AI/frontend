// frontend/src/stores/bookmarkStore.js
import { defineStore } from 'pinia'
import { bookmarkService } from '@/services/bookmarkService'
import { useCrudActions } from '@/composables/useCrudActions'
import { useNotify } from '@/composables/useNotify'
import { standardState, standardGetters, makeReset } from '@/stores/storeHelpers'

const _pendingToggles = new Map()

export const useBookmarkStore = defineStore('bookmarks', {
  state: () => standardState({ bookmarkedIds: [], count: 0 }),
  getters: {
    ...standardGetters,
    isBookmarked: (state) => (id) => state.bookmarkedIds.includes(id),
  },
  actions: {
    async fetchBookmarks() {
      const { wrap } = useCrudActions(this)
      return await wrap(() => bookmarkService.list(), {
        successMsg: null,
        errorMsgFallbackKey: 'notifications.bookmarksLoadFailed',
        onSuccess: (res) => {
          this.bookmarkedIds = res.items.map(q => q.id)
          this.count = res.count || res.items.length
        },
      })
    },
    async toggle(questionId) {
      const { notify } = useNotify()
      const { wrap } = useCrudActions(this)

      if (_pendingToggles.has(questionId)) {
        return await _pendingToggles.get(questionId)
      }

      const togglePromise = this._executeToggle(questionId, wrap)
      _pendingToggles.set(questionId, togglePromise)

      try {
        return await togglePromise
      } finally {
        _pendingToggles.delete(questionId)
      }
    },
    async _executeToggle(questionId, wrap) {
      // --- Optimistic Update ---
      const idx = this.bookmarkedIds.indexOf(questionId)
      const wasBookmarked = idx !== -1

      if (wasBookmarked) {
        this.bookmarkedIds.splice(idx, 1)
        this.count = Math.max(0, this.count - 1)
      } else {
        this.bookmarkedIds.push(questionId)
        this.count += 1
      }

      return await wrap(() => bookmarkService.toggle(questionId), {
        successMsg: null,
        errorMsgFallbackKey: 'notifications.bookmarkToggleFailed',
        onSuccess: (res) => {
          const isNowBookmarked = res.added
          const currentIdx = this.bookmarkedIds.indexOf(questionId)
          const currentlyBookmarked = currentIdx !== -1

          if (isNowBookmarked && !currentlyBookmarked) {
            this.bookmarkedIds.push(questionId)
            this.count += 1
          } else if (!isNowBookmarked && currentlyBookmarked) {
            this.bookmarkedIds.splice(currentIdx, 1)
            this.count = Math.max(0, this.count - 1)
          }
        },
        onError: () => {

          if (wasBookmarked) {
            // Was bookmarked before optimistic remove → re-add if missing
            if (!this.bookmarkedIds.includes(questionId)) {
              this.bookmarkedIds.push(questionId)
            }
          } else {
            // Was not bookmarked before optimistic add → remove if present
            const revertIdx = this.bookmarkedIds.indexOf(questionId)
            if (revertIdx !== -1) {
              this.bookmarkedIds.splice(revertIdx, 1)
            }
          }
          // Always reconcile count to match actual array length
          this.count = this.bookmarkedIds.length
        },
      })
    },
    reset: makeReset({ bookmarkedIds: [], count: 0, status: 'idle', error: null }),
  },
})
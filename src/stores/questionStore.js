// frontend/src/stores/questionStore.js
import { defineStore } from 'pinia'
import { reactive } from 'vue'
import { questionService } from '@/services/questionService'
import { storageService } from '@/services/storageService'
import { useCrudActions } from '@/composables/useCrudActions'
import { useNotify } from '@/composables/useNotify'
import { i18n } from '@/i18n'
import {
  standardState,
  standardGetters,
  subResourceState,
  subResourceGetters,
  makeReset,
} from '@/stores/storeHelpers'

// Backend paginate() clamps per_page to 500 (see apps/core/utils.py).
// Requesting 1000 caused the store's local `pagination.per_page` to
// record 1000 while the server returned at most 500 rows, silently
// desynchronising any consumer that trusted the local value.
const MAX_PER_PAGE = 500

// ──────────────────────────────────────────────────────────────────
// In-flight verification map.
//
// `toggleVerify` performs an optimistic flip of `byId[id].verified`
// before awaiting the server, and reverts to the captured
// `previousVerified` if the request fails. Two rapid calls on the
// same question used to produce a corrupted revert:
//
//   • Call 1 captures previousVerified = true, optimistic → false.
//   • Call 2 captures previousVerified = false (call 1's optimistic
//     value, not the true original), optimistic → true.
//   • Both requests land on the server. The first toggles true→false;
//     the second toggles false→true. Server ends at `true`.
//   • If call 1's success handler lands AFTER call 2's, the store
//     writes `false` and disagrees with the server until the next
//     fetch.
//
// The map keys on question id. The second call returns the first
// call's promise unchanged, so exactly one request fires per
// question per in-flight window and the revert path only ever sees
// the true pre-toggle value.
//
// REACTIVITY
// ----------
// `reactive(new Map())`, not `new Map()`. The `isVerifying` getter
// below returns a function that calls `.has(id)` on this map; if the
// map were plain, Vue would have nothing to track and every component
// reading the getter would show a stale value. The reactive proxy
// tracks `.has()` / `.get()` reads per key, so a `.set()` or
// `.delete()` inside the action invalidates exactly the components
// that read that id.
//
// The map is read via a getter rather than directly so a component
// can ask "is THIS question being verified" instead of reading a
// store-wide boolean. See QuestionCardActions.vue.
// ──────────────────────────────────────────────────────────────────
const _pendingVerifications = reactive(new Map())

export const useQuestionStore = defineStore('questions', {
  state: () =>
    standardState({
      byId: {},
      ids: [],
      currentItem: null,
      pagination: { page: 1, per_page: 20, total: 0, total_pages: 1 },
      filters: {},
      ...subResourceState('unverified'),
      unverifiedIds: [],
      unverifiedById: {},
      unverifiedPagination: { page: 1, per_page: 20, total: 0, total_pages: 1 },
    }),
  getters: {
    ...standardGetters,
    ...subResourceGetters('unverified'),
    items: (state) => state.ids.map((id) => state.byId[id]),
    hasItems: (state) => state.ids.length > 0,
    isEmpty: (state) => state.ids.length === 0 && state.status !== 'loading',
    unverifiedItems: (state) => state.unverifiedIds.map((id) => state.unverifiedById[id]),
    hasUnverified: (state) => state.unverifiedIds.length > 0,

    // Whether a verify request for the given question id is currently
    // in flight. Consumers call it as `store.isVerifying(id)`. The
    // returned function reads the reactive map, so a change to that
    // question's in-flight state invalidates whichever component
    // computed called the getter.
    isVerifying: () => (id) => _pendingVerifications.has(id),
  },
  actions: {
    setPagination(pagination) {
      this.pagination = { ...this.pagination, ...pagination }
    },
    setFilters(filters) {
      this.filters = { ...this.filters, ...filters }
    },
    resetFilters() {
      this.filters = {}
    },

    async fetchList(params = {}) {
      const { wrap } = useCrudActions(this)
      const cacheKey = `questions_${JSON.stringify(params)}`
      return await wrap(() => questionService.list(params), {
        cacheKey,
        errorMsgFallbackKey: 'notifications.questionsLoadFailed',
        onSuccess: (res) => {
          const items = res.items || []
          const newById = {}
          const newIds = []
          for (const q of items) {
            newById[q.id] = q
            newIds.push(q.id)
          }
          this.$patch({ byId: newById, ids: newIds })
          if (res.total !== undefined) {
            this.pagination.total = res.total
            this.pagination.page = res.page || 1
            this.pagination.per_page = res.per_page || 20
            this.pagination.total_pages = res.total_pages || 1
          }
        },
      })
    },

    async fetchAll() {
      return this.fetchList({ per_page: MAX_PER_PAGE })
    },

    async fetchOne(id) {
      const { wrap } = useCrudActions(this)
      return await wrap(() => questionService.get(id), {
        onSuccess: (item) => {
          this.$patch((state) => {
            state.byId[item.id] = item
          })
          this.currentItem = item
        },
        errorMsgFallbackKey: 'notifications.questionFetchFailed',
      })
    },

    async fetchBatch(ids) {
      const response = await questionService.batch(ids)
      const items = response?.items || []
      this.$patch((state) => {
        for (const item of items) state.byId[item.id] = item
      })
      return response
    },

    async create(data) {
      const { wrap } = useCrudActions(this)
      return await wrap(() => questionService.create(data), {
        invalidateOnSuccess: 'questions_',
        successMsgKey: 'notifications.questionCreated',
        onSuccess: (item) => {
          this.$patch((state) => {
            state.byId[item.id] = item
            state.ids = [item.id, ...state.ids]
            state.pagination.total += 1
          })
        },
        errorMsgFallbackKey: 'notifications.questionCreateFailed',
      })
    },

    async update(id, data) {
      const { wrap } = useCrudActions(this)
      const current = this.byId[id]
      if (current && current.version !== undefined && !data.expected_version) {
        data = { ...data, expected_version: current.version }
      }
      return await wrap(() => questionService.update(id, data), {
        invalidateOnSuccess: 'questions_',
        successMsgKey: 'notifications.questionUpdated',
        onSuccess: (item) => {
          this.$patch((state) => {
            state.byId[id] = item
          })
          if (this.currentItem?.id === id) this.currentItem = item
        },
        errorMsgFallbackKey: 'notifications.questionUpdateFailed',
      })
    },

    // ── remove ─────────────────────────────────────────────────────
    //
    // INVALIDATION SCOPE
    // ------------------
    // Only the `questions_` cache prefix is invalidated. The previous
    // version also listed `'bookmarks'`, but `bookmarkStore.fetchBookmarks`
    // never passes a `cacheKey` to `wrap()` — it always hits the
    // network — so that prefix was dead. Removing it makes the
    // invalidation list reflect what the code actually caches.
    //
    // If `fetchBookmarks` is ever given a `cacheKey`, re-add
    // `'bookmarks'` here in the same change. Bookmark state itself is
    // updated directly by `bookmarkStore.toggle` and by the removal
    // path in `Bookmarks.vue`; this store only needs to invalidate
    // caches that actually exist.
    async remove(id) {
      const { wrap } = useCrudActions(this)
      return await wrap(() => questionService.delete(id), {
        invalidateOnSuccess: 'questions_',
        successMsgKey: 'notifications.questionDeleted',
        onSuccess: () => {
          this.$patch((state) => {
            delete state.byId[id]
            state.ids = state.ids.filter((i) => i !== id)
            delete state.unverifiedById[id]
            state.unverifiedIds = state.unverifiedIds.filter((i) => i !== id)
            state.pagination.total = Math.max(0, state.pagination.total - 1)
          })
          if (this.currentItem?.id === id) this.currentItem = null
        },
        errorMsgFallbackKey: 'notifications.questionDeleteFailed',
      })
    },

    // ── toggleVerify (with in-flight dedup) ────────────────────────
    //
    // A second call for the same id while the first is still pending
    // returns the first call's promise. See the module-level comment
    // on `_pendingVerifications` for the failure mode this prevents.
    async toggleVerify(id) {
      if (_pendingVerifications.has(id)) {
        return _pendingVerifications.get(id)
      }
      const promise = this._executeToggleVerify(id)
      _pendingVerifications.set(id, promise)
      try {
        return await promise
      } finally {
        _pendingVerifications.delete(id)
      }
    },

    async _executeToggleVerify(id) {
      const { wrap } = useCrudActions(this)
      const item = this.byId[id]
      let previousVerified = false
      if (item) {
        previousVerified = item.verified
        this.$patch((state) => {
          if (state.byId[id]) state.byId[id].verified = !state.byId[id].verified
        })
      }
      if (this.currentItem?.id === id) {
        this.currentItem.verified = !this.currentItem.verified
      }
      return await wrap(() => questionService.toggleVerify(id), {
        invalidateOnSuccess: 'questions_',
        onSuccess: (res) => {
          const verified = typeof res?.verified === 'boolean' ? res.verified : !previousVerified
          this.$patch((state) => {
            if (state.byId[id]) state.byId[id].verified = verified
          })
          if (this.currentItem?.id === id) this.currentItem.verified = verified
          const key = verified
            ? 'notifications.questionVerified'
            : 'notifications.questionUnverified'
          useNotify().notify(i18n.global.t(key), 'success')
        },
        errorMsgFallbackKey: 'notifications.questionVerifyFailed',
        onError: () => {
          this.$patch((state) => {
            if (state.byId[id]) state.byId[id].verified = previousVerified
          })
          if (this.currentItem?.id === id) {
            this.currentItem.verified = previousVerified
          }
        },
      })
    },

    async bulkVerify(questionIds, action = 'verify', notes = '') {
      const { wrap } = useCrudActions(this)
      return await wrap(() => questionService.bulkVerify(questionIds, action, notes), {
        invalidateOnSuccess: 'questions_',
        onSuccess: (res) => {
          const count = res?.count ?? questionIds.length
          const key =
            action === 'verify'
              ? 'notifications.questionBulkVerified'
              : 'notifications.questionBulkUnverified'
          useNotify().notify(i18n.global.t(key, { count }), 'success')
        },
        errorMsgFallbackKey: 'notifications.questionBulkVerifyFailed',
      })
    },

    async duplicate(id) {
      const { wrap } = useCrudActions(this)
      return await wrap(() => questionService.duplicate(id), {
        invalidateOnSuccess: 'questions_',
        successMsgKey: 'notifications.questionDuplicated',
        errorMsgFallbackKey: 'notifications.questionDuplicateFailed',
        onSuccess: (newQ) => {
          this.$patch((state) => {
            state.byId[newQ.id] = newQ
            state.ids = [newQ.id, ...state.ids]
            state.pagination.total += 1
          })
        },
      })
    },

    async fetchUnverified(params = {}) {
      const { wrap } = useCrudActions(this, {
        statusKey: 'unverifiedStatus',
        errorKey: 'unverifiedError',
      })
      return await wrap(() => questionService.getUnverified({ ...params }), {
        onSuccess: (res) => {
          const items = res.items || []
          const newById = {}
          const newIds = []
          for (const item of items) {
            newById[item.id] = item
            newIds.push(item.id)
          }
          this.$patch({
            unverifiedById: newById,
            unverifiedIds: newIds,
            unverifiedPagination: {
              page: res.page || 1,
              per_page: res.per_page || 20,
              total: res.total || 0,
              total_pages: res.total_pages || 1,
            },
          })
        },
        errorMsgFallbackKey: 'notifications.unverifiedQuestionsLoadFailed',
      })
    },

    async bulkUpdateTags(questionIds, addTags, removeTags) {
      const { wrap } = useCrudActions(this)
      return await wrap(() => questionService.bulkUpdateTags(questionIds, addTags, removeTags), {
        invalidateOnSuccess: 'questions_',
        successMsgKey: 'notifications.questionTagsUpdated',
        errorMsgFallbackKey: 'notifications.questionBulkTagsFailed',
      })
    },

    async rate(id, rating) {
      return await questionService.rateQuestion(id, rating)
    },

    rememberLastViewed(id, userId = 'guest') {
      storageService.setItem(`last_viewed_question_id_${userId}`, String(id))
    },

    reset: makeReset({
      byId: {},
      ids: [],
      currentItem: null,
      pagination: { page: 1, per_page: 20, total: 0, total_pages: 1 },
      filters: {},
      unverifiedStatus: 'idle',
      unverifiedError: null,
      unverifiedIds: [],
      unverifiedById: {},
      unverifiedPagination: { page: 1, per_page: 20, total: 0, total_pages: 1 },
      status: 'idle',
      error: null,
    }),
  },
})

// frontend/src/stores/wrongAnswerStore.js
//
// FEATURES #1 / #2 / #5 — reactive state for the wrong-answer
// notebook, the fragile-correct list, the attempt summary, and the
// SRS due count.
//
// FEATURE (unified Study Now queue): added `studyNowQueue` state and
// a `fetchStudyNow(limit)` action. The action is a thin call to
// questionService.studyNow(); the queue assembler lives on the server
// so it can join against the SRS and analytics tables in one place.
import { defineStore } from 'pinia'
import { wrongAnswerService } from '@/services/wrongAnswerService'
import { questionService } from '@/services/questionService'
import { useCrudActions } from '@/composables/useCrudActions'
import {
  standardState,
  standardGetters,
  subResourceState,
  subResourceGetters,
  makeReset,
} from '@/stores/storeHelpers'

export const useWrongAnswerStore = defineStore('wrongAnswers', {
  state: () => standardState({
    // Mistake list state
    mistakeIds: [],
    mistakeById: {},
    mistakePagination: { page: 1, per_page: 20, total: 0, total_pages: 1 },

    // Fragile list state
    fragileIds: [],
    fragileById: {},
    fragilePagination: { page: 1, per_page: 20, total: 0, total_pages: 1 },

    // Scalar counts (dashboard + navbar)
    summary: null,
    srsDueCount: 0,

    // ── FEATURE (unified Study Now queue) ─────────────────────────
    studyNowQueue: null,
    ...subResourceState('studyNow'),
  }),

  getters: {
    ...standardGetters,
    ...subResourceGetters('studyNow'),
    mistakes: (state) => state.mistakeIds.map(id => state.mistakeById[id]),
    fragile: (state) => state.fragileIds.map(id => state.fragileById[id]),
    hasMistakes: (state) => state.mistakeIds.length > 0,
    hasFragile: (state) => state.fragileIds.length > 0,
  },

  actions: {
    async fetchMistakes(params = {}) {
      const { wrap } = useCrudActions(this, {
        statusKey: 'status',
        errorKey: 'error',
      })
      return await wrap(() => wrongAnswerService.listMistakes(params), {
        successMsg: null,
        errorMsgFallbackKey: 'notifications.mistakesLoadFailed',
        onSuccess: (res) => {
          const items = res.items || []
          const byId = {}
          const ids = []
          for (const q of items) {
            byId[q.id] = q
            ids.push(q.id)
          }
          this.$patch({
            mistakeById: byId,
            mistakeIds: ids,
            mistakePagination: {
              page: res.page || 1,
              per_page: res.per_page || 20,
              total: res.total || 0,
              total_pages: res.total_pages || 1,
            },
          })
        },
      })
    },

    async fetchFragile(params = {}) {
      const { wrap } = useCrudActions(this)
      return await wrap(() => wrongAnswerService.listFragile(params), {
        successMsg: null,
        errorMsgFallbackKey: 'notifications.fragileLoadFailed',
        onSuccess: (res) => {
          const items = res.items || []
          const byId = {}
          const ids = []
          for (const q of items) {
            byId[q.id] = q
            ids.push(q.id)
          }
          this.$patch({
            fragileById: byId,
            fragileIds: ids,
            fragilePagination: {
              page: res.page || 1,
              per_page: res.per_page || 20,
              total: res.total || 0,
              total_pages: res.total_pages || 1,
            },
          })
        },
      })
    },

    async fetchSummary() {
      const { wrap } = useCrudActions(this)
      return await wrap(() => wrongAnswerService.summary(), {
        successMsg: null,
        errorMsgFallbackKey: 'notifications.summaryLoadFailed',
        suppressErrorToast: true,
        onSuccess: (data) => {
          this.summary = data
          if (data && typeof data.due_now === 'number') {
            this.srsDueCount = data.due_now
          }
        },
      })
    },

    async fetchSrsDueCount() {
      const { wrap } = useCrudActions(this)
      return await wrap(() => wrongAnswerService.dueCount(), {
        successMsg: null,
        errorMsgFallbackKey: 'notifications.dueCountLoadFailed',
        suppressErrorToast: true,
        onSuccess: (data) => {
          this.srsDueCount = data?.count || 0
        },
      })
    },

    // ── FEATURE (unified Study Now queue) ─────────────────────────
    async fetchStudyNow(limit = 20) {
      const { wrap } = useCrudActions(this, {
        statusKey: 'studyNowStatus',
        errorKey: 'studyNowError',
      })
      return await wrap(() => questionService.studyNow(limit), {
        successMsg: null,
        errorMsgFallbackKey: 'notifications.studyNowLoadFailed',
        onSuccess: (data) => {
          this.studyNowQueue = data
        },
      })
    },

    reset: makeReset({
      mistakeIds: [],
      mistakeById: {},
      mistakePagination: { page: 1, per_page: 20, total: 0, total_pages: 1 },
      fragileIds: [],
      fragileById: {},
      fragilePagination: { page: 1, per_page: 20, total: 0, total_pages: 1 },
      summary: null,
      srsDueCount: 0,
      studyNowQueue: null,
      studyNowStatus: 'idle',
      studyNowError: null,
      status: 'idle',
      error: null,
    }),
  },
})
// frontend/src/stores/masterExamStore.js
import { defineStore } from 'pinia'
import { masterExamService } from '@/services/masterExamService'
import { useCrudActions } from '@/composables/useCrudActions'
import {
  standardState,
  standardGetters,
  subResourceState,
  subResourceGetters,
  makeReset,
} from '@/stores/storeHelpers'

export const useMasterExamStore = defineStore('masterExam', {
  state: () =>
    standardState({
      items: [],
      byId: {},
      resultsById: {},
      drafts: [],
      draftsTotal: 0,
      draftsSearch: '',
      draftsUsageFilter: '',
      needsAckCount: 0,
      needsAckItems: [],
      ...subResourceState('drafts'),
    }),

  getters: {
    ...standardGetters,
    ...subResourceGetters('drafts'),
    ownedExams: (state) => state.items.filter((e) => e.is_owner),
    assignedExams: (state) => state.items.filter((e) => !e.is_owner),
    activeExams: (state) => state.items.filter((e) => e.status === 'active'),
    upcomingExams: (state) => state.items.filter((e) => e.status === 'scheduled'),
  },

  actions: {
    async fetchList(params = {}) {
      const { wrap } = useCrudActions(this)
      return await wrap(() => masterExamService.list(params), {
        errorMsgFallbackKey: 'masterExams.listLoadFailed',
        onSuccess: (res) => {
          this.items = res.items || []
        },
      })
    },

    async fetchOne(id) {
      const { wrap } = useCrudActions(this)
      return await wrap(() => masterExamService.get(id), {
        errorMsgFallbackKey: 'masterExams.detailLoadFailed',
        onSuccess: (data) => {
          this.$patch((state) => {
            state.byId[id] = data
          })
        },
      })
    },

    async fetchResults(id) {
      const { wrap } = useCrudActions(this)
      return await wrap(() => masterExamService.results(id), {
        errorMsgFallbackKey: 'masterExams.resultsLoadFailed',
        suppressErrorToast: true,
        onSuccess: (data) => {
          this.resultsById = { ...this.resultsById, [id]: data }
        },
      })
    },

    summaryCsvUrl(id) {
      return masterExamService.summaryCsvUrl(id)
    },

    matrixCsvUrl(id) {
      return masterExamService.matrixCsvUrl(id)
    },

    async create(data) {
      const { wrap } = useCrudActions(this)
      return await wrap(() => masterExamService.create(data), {
        successMsgKey: 'notifications.masterExamCreated',
        errorMsgFallbackKey: 'masterExams.createFailed',
        onSuccess: (exam) => {
          this.items = [exam, ...this.items]
          this.$patch((state) => {
            state.byId[exam.id] = exam
          })
        },
      })
    },

    async update(id, data) {
      const { wrap } = useCrudActions(this)
      return await wrap(() => masterExamService.update(id, data), {
        successMsgKey: 'notifications.masterExamUpdated',
        errorMsgFallbackKey: 'masterExams.updateFailed',
        onSuccess: (exam) => {
          const idx = this.items.findIndex((e) => e.id === id)
          if (idx !== -1) this.items.splice(idx, 1, { ...this.items[idx], ...exam })
          this.$patch((state) => {
            state.byId[id] = exam
          })
        },
      })
    },

    async remove(id, deleteMode) {
      const { wrap } = useCrudActions(this)
      return await wrap(() => masterExamService.delete(id, deleteMode), {
        successMsgKey: 'notifications.masterExamDeleted',
        errorMsgFallbackKey: 'masterExams.deleteFailed',
        onSuccess: () => {
          this.items = this.items.filter((e) => e.id !== id)
          const newById = { ...this.byId }
          delete newById[id]
          this.byId = newById
        },
      })
    },

    async addQuestions(id, questionIds) {
      const { wrap } = useCrudActions(this)
      return await wrap(() => masterExamService.addQuestions(id, questionIds), {
        successMsgKey: 'notifications.masterExamQuestionsAdded',
        errorMsgFallbackKey: 'masterExams.addQuestionsFailed',
        onSuccess: (exam) => {
          this.$patch((state) => {
            state.byId[id] = exam
          })
        },
      })
    },

    async removeQuestion(id, questionId) {
      const { wrap } = useCrudActions(this)
      return await wrap(() => masterExamService.removeQuestion(id, questionId), {
        successMsgKey: 'notifications.masterExamQuestionRemoved',
        errorMsgFallbackKey: 'masterExams.removeQuestionFailed',
        onSuccess: (exam) => {
          this.$patch((state) => {
            state.byId[id] = exam
          })
        },
      })
    },

    async reorder(id, questionIds) {
      const { wrap } = useCrudActions(this)
      return await wrap(() => masterExamService.reorder(id, questionIds), {
        successMsg: null,
        errorMsgFallbackKey: 'masterExams.reorderFailed',
        onSuccess: (exam) => {
          this.$patch((state) => {
            state.byId[id] = exam
          })
        },
      })
    },

    async addDraft(id, draftPayload) {
      const { wrap } = useCrudActions(this)
      return await wrap(() => masterExamService.addDraft(id, draftPayload), {
        successMsgKey: 'notifications.masterExamDraftAdded',
        errorMsgFallbackKey: 'masterExams.addDraftFailed',
        onSuccess: (draft) => {
          this.drafts = [draft, ...this.drafts]
          this.draftsTotal += 1
        },
      })
    },

    async publish(id) {
      const { wrap } = useCrudActions(this)
      return await wrap(() => masterExamService.publish(id), {
        successMsgKey: 'notifications.masterExamPublished',
        errorMsgFallbackKey: 'masterExams.publishFailed',
        onSuccess: (exam) => {
          this.$patch((state) => {
            state.byId[id] = exam
          })
          const idx = this.items.findIndex((e) => e.id === id)
          if (idx !== -1) this.items.splice(idx, 1, { ...this.items[idx], ...exam })
        },
      })
    },

    async cancel(id) {
      const { wrap } = useCrudActions(this)
      return await wrap(() => masterExamService.cancel(id), {
        successMsgKey: 'notifications.masterExamCancelled',
        errorMsgFallbackKey: 'masterExams.cancelFailed',
        onSuccess: (exam) => {
          this.$patch((state) => {
            state.byId[id] = exam
          })
          const idx = this.items.findIndex((e) => e.id === id)
          if (idx !== -1) this.items.splice(idx, 1, { ...this.items[idx], ...exam })
        },
      })
    },

    async publishToBank(id) {
      const { wrap } = useCrudActions(this)
      return await wrap(() => masterExamService.publishToBank(id), {
        successMsgKey: 'notifications.masterExamPublishedToBank',
        errorMsgFallbackKey: 'masterExams.publishToBankFailed',
        onSuccess: (exam) => {
          this.$patch((state) => {
            state.byId[id] = exam
          })
        },
      })
    },

    async acknowledge(id) {
      // The optimistic removal used to happen unconditionally, even
      // on failure. That produced a user-visible bug: the badge
      // count on the "needs acknowledgement" list decremented, the
      // exam disappeared from the dashboard banner, and then
      // silently reappeared on the next page load because the
      // server still had it pending. Mutating state only inside
      // the `try` after the await ensures the local view reflects
      // what the server actually recorded.
      try {
        await masterExamService.acknowledge(id)
        this.needsAckItems = this.needsAckItems.filter((item) => item.id !== id)
        this.needsAckCount = this.needsAckItems.length
      } catch (e) {
        // Silent — ack is best-effort. The item stays visible so
        // the user can retry, and the next fetchNeedsAck() will
        // re-sync from the server anyway.
      }
    },

    async fetchNeedsAck() {
      const { wrap } = useCrudActions(this)
      return await wrap(() => masterExamService.needsAcknowledgement(), {
        errorMsgFallbackKey: 'masterExams.needsAckLoadFailed',
        suppressErrorToast: true,
        onSuccess: (res) => {
          this.needsAckCount = res.count || 0
          this.needsAckItems = res.items || []
        },
      })
    },

    async fetchDrafts(params = {}) {
      const { wrap } = useCrudActions(this, {
        statusKey: 'draftsStatus',
        errorKey: 'draftsError',
      })
      return await wrap(() => masterExamService.draftsLibrary(params), {
        errorMsgFallbackKey: 'masterExams.draftsLoadFailed',
        onSuccess: (res) => {
          this.drafts = res.items || []
          this.draftsTotal = res.total || 0
        },
      })
    },

    setDraftsSearch(q) {
      this.draftsSearch = q
    },
    setDraftsUsageFilter(v) {
      this.draftsUsageFilter = v
    },

    async updateDraft(draftId, data) {
      const { wrap } = useCrudActions(this)
      return await wrap(() => masterExamService.updateDraft(draftId, data), {
        successMsgKey: 'notifications.masterExamDraftUpdated',
        errorMsgFallbackKey: 'masterExams.draftUpdateFailed',
        onSuccess: (draft) => {
          const idx = this.drafts.findIndex((d) => d.id === draftId)
          if (idx !== -1) this.drafts.splice(idx, 1, draft)
        },
      })
    },

    async deleteDraft(draftId) {
      const { wrap } = useCrudActions(this)
      return await wrap(() => masterExamService.deleteDraft(draftId), {
        successMsgKey: 'notifications.masterExamDraftDeleted',
        errorMsgFallbackKey: 'masterExams.draftDeleteFailed',
        onSuccess: () => {
          this.drafts = this.drafts.filter((d) => d.id !== draftId)
          this.draftsTotal = Math.max(0, this.draftsTotal - 1)
        },
      })
    },

    reset: makeReset({
      items: [],
      byId: {},
      resultsById: {},
      drafts: [],
      draftsTotal: 0,
      draftsSearch: '',
      draftsUsageFilter: '',
      needsAckCount: 0,
      needsAckItems: [],
      draftsStatus: 'idle',
      draftsError: null,
      status: 'idle',
      error: null,
    }),
  },
})

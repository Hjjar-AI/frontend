// frontend/src/stores/studyPlannerStore.js
import { defineStore } from 'pinia'
import { apiClient } from '@/services/api/client'
import { ENDPOINTS } from '@/services/api/endpoints'
import { useCrudActions } from '@/composables/useCrudActions'
import { standardState, standardGetters, makeReset } from '@/stores/storeHelpers'

export const useStudyPlannerStore = defineStore('studyPlanner', {
  state: () => standardState({ planner: null }),
  getters: {
    ...standardGetters,
    todayProgress: (state) => {
      if (!state.planner || !state.planner.daily_progress) return 0
      const today = state.planner.today || new Date().toISOString().slice(0, 10)
      return state.planner.daily_progress[today] || 0
    },
    targetReached: (state) => {
      if (!state.planner) return false
      return state.todayProgress >= state.planner.target_questions_per_day
    },
  },
  actions: {
    async fetchPlanner() {
      const { wrap } = useCrudActions(this)
      return await wrap(() => apiClient.get(ENDPOINTS.STUDY_PLANNER.BASE), {
        errorMsgFallbackKey: 'notifications.plannerLoadFailed',
        onSuccess: (data) => { this.planner = data },
      })
    },

    async updatePlanner(data) {
      const { wrap } = useCrudActions(this)
      return await wrap(() => apiClient.post(ENDPOINTS.STUDY_PLANNER.UPDATE, data), {
        successMsgKey: 'notifications.plannerUpdated',
        errorMsgFallbackKey: 'notifications.plannerUpdateFailed',
        onSuccess: () => this.fetchPlanner(),
      })
    },

    async recordProgress() {
      const { wrap } = useCrudActions(this)
      return await wrap(() => apiClient.post(ENDPOINTS.STUDY_PLANNER.PROGRESS), {
        successMsg: null,
        errorMsgFallbackKey: 'notifications.plannerProgressFailed',
      })
    },

    async deletePlanner() {
      const { wrap } = useCrudActions(this)
      return await wrap(() => apiClient.delete(ENDPOINTS.STUDY_PLANNER.DELETE), {
        successMsgKey: 'notifications.plannerDeleted',
        errorMsgFallbackKey: 'notifications.plannerDeleteFailed',
        onSuccess: () => { this.planner = null },
      })
    },

    //
    // Every other store in the app implements reset via the shared
    // `makeReset({...})` helper (see categoryStore, questionStore,
    // groupStore, bookmarkStore, …). Using `$reset()` here was the
    // one outlier. Behaviour is identical; the change is purely for
    // consistency with the rest of the codebase and so that a future
    // change to the state shape has one obvious place to update the
    // reset payload (rather than relying on Pinia to infer it from
    // the initial state).
    reset: makeReset({
      planner: null,
      status: 'idle',
      error: null,
    }),
  },
})
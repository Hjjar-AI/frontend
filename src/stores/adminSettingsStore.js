// frontend/src/stores/adminSettingsStore.js
import { defineStore } from 'pinia'
import { adminService } from '@/services/adminService'
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

export const useAdminSettingsStore = defineStore('adminSettings', {
  state: () => standardState({
    settings: {},
    ...subResourceState('rankRefresh'),
    ...subResourceState('seedQuestions'),
    lastRankRefreshResult: null,
    lastSeedResult: null,
  }),
  getters: {
    ...standardGetters,
    ...subResourceGetters('rankRefresh'),
    ...subResourceGetters('seedQuestions'),
  },
  actions: {
    async fetchSettings() {
      return await useCrudActions(this).wrap(() => adminService.getSettings(), {
        errorMsgFallbackKey: 'notifications.settingsLoadFailed',
        onSuccess: (data) => { this.settings = data },
      })
    },

    async updateSettings(data) {
      return await useCrudActions(this).wrap(() => adminService.updateSettings(data), {
        successMsgKey: 'notifications.settingsUpdated',
        errorMsgFallbackKey: 'notifications.settingsUpdateFailed',
        onSuccess: () => { this.fetchSettings() },
      })
    },

    async refreshAuthorRanks() {
      const { notify } = useNotify()
      const { wrap } = useCrudActions(this, {
        statusKey: 'rankRefreshStatus',
        errorKey: 'rankRefreshError',
      })
      return await wrap(() => adminService.refreshAuthorRanks(), {
        successMsg: null,
        errorMsgFallbackKey: 'notifications.rankRefreshFailed',
        onSuccess: (res) => {
          this.lastRankRefreshResult = res
          const updated = res?.updated ?? 0
          const scanned = res?.scanned ?? 0
          const key = updated === 0
            ? 'notifications.rankRefreshNone'
            : 'notifications.rankRefreshDone'
          notify(i18n.global.t(key, { updated, scanned }), 'success')
        },
      })
    },

    async seedSampleQuestions() {
      const { notify } = useNotify()
      const { wrap } = useCrudActions(this, {
        statusKey: 'seedQuestionsStatus',
        errorKey: 'seedQuestionsError',
      })
      return await wrap(() => adminService.seedSampleQuestions(), {
        successMsg: null,
        errorMsgFallbackKey: 'notifications.seedFailed',
        onSuccess: (res) => {
          this.lastSeedResult = res
          // The management command's stdout is server-side text we
          // cannot translate client-side. Show a generic translated
          // confirmation instead; the raw output stays available in
          // `lastSeedResult` for debugging.
          notify(i18n.global.t('notifications.seedDone'), 'success')
        },
      })
    },

    reset: makeReset({
      settings: {},
      rankRefreshStatus: 'idle',
      rankRefreshError: null,
      seedQuestionsStatus: 'idle',
      seedQuestionsError: null,
      lastRankRefreshResult: null,
      lastSeedResult: null,
      status: 'idle',
      error: null,
    }),
  },
})
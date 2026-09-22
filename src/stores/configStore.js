// frontend/src/stores/configStore.js
import { defineStore } from 'pinia'
import { apiClient } from '@/services/api/client'
import { ENDPOINTS } from '@/services/api/endpoints'
import { useCrudActions } from '@/composables/useCrudActions'
import { i18n } from '@/i18n'
import { standardState, standardGetters, makeReset } from '@/stores/storeHelpers'
import {
  FALLBACK_MAX_CHOICES,
  FALLBACK_ITEMS_PER_PAGE,
  FALLBACK_MAX_QUIZ_QUESTIONS,
} from '@/utils/constants'

// The roles dict mirrors PublicConfigView's response. Three roles in
// this deployment: admin, moderator, member. Updated in lockstep with
// apps/users/models.py ROLE_CHOICES and apps/core/views.py
// PublicConfigView. If a fourth role is added, update all three.
const DEFAULT_ROLES = {
  admin: 'admin',
  moderator: 'moderator',
  member: 'member',
}

export const useConfigStore = defineStore('appConfig', {
  state: () => standardState({
    maxQuizQuestions: FALLBACK_MAX_QUIZ_QUESTIONS,
    maxChoices: FALLBACK_MAX_CHOICES,
    itemsPerPage: FALLBACK_ITEMS_PER_PAGE,
    roles: { ...DEFAULT_ROLES },
    loaded: false,
  }),
  getters: {
    ...standardGetters,
  },
  actions: {
    async fetchConfig() {
      const { wrap } = useCrudActions(this)
      return await wrap(() => apiClient.get(ENDPOINTS.CONFIG), {
        successMsg: null,
        errorMsgFallbackKey: 'notifications.settingsLoadFailed',
        suppressErrorToast: true,
        onSuccess: (data) => {
          if (data) {
            this.maxQuizQuestions = data.max_quiz_questions ?? this.maxQuizQuestions
            this.maxChoices = data.max_choices ?? this.maxChoices
            this.itemsPerPage = data.items_per_page ?? this.itemsPerPage
            this.roles = data.roles ?? { ...DEFAULT_ROLES }
            this.loaded = true
            this.error = null
          }
        },
        onError: (err) => {
          this.loaded = true
          // Route through the same i18n key that wrap() uses, so a
          // caller reading `configStore.error` sees the message in
          // the active locale.
          this.error = err?.message || i18n.global.t('notifications.settingsLoadFailed')
        },
      })
    },
    reset: makeReset({
      maxQuizQuestions: FALLBACK_MAX_QUIZ_QUESTIONS,
      maxChoices: FALLBACK_MAX_CHOICES,
      itemsPerPage: FALLBACK_ITEMS_PER_PAGE,
      roles: { ...DEFAULT_ROLES },
      loaded: false,
      error: null,
      status: 'idle',
    }),
  },
})
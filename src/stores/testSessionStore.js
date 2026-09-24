// frontend/src/stores/testSessionStore.js
import { defineStore } from 'pinia'
import { createTestService } from '@/services/testServiceFactory'
import { useCrudActions } from '@/composables/useCrudActions'
import { useDialog } from '@/composables/useDialog'
import { useConfigStore } from '@/stores/configStore'
import { i18n } from '@/i18n'
import { FALLBACK_MAX_CHOICES } from '@/utils/constants'
import { normalizeConfidenceScore } from '@/utils/confidence'
import {
  standardState,
  standardGetters,
  subResourceState,
  subResourceGetters,
} from '@/stores/storeHelpers'

const SESSION_MODE_KEY = 'test_session_mode'
const SESSION_ID_KEY = 'test_session_id'
const VALID_MODES = ['exam', 'study', 'recall']

// ──────────────────────────────────────────────────────────────────
// Safe sessionStorage wrappers.
//
// `sessionStorage` throws on access in several environments this app
// is expected to run in — Safari private mode, embedded webviews
// with site-data disabled, browsers configured to block storage for
// the origin. The previous direct accesses crashed the store on
// boot in any of those cases: `hydrateFromSession` is called from
// `main.js` before the app mounts, so a throwing `getItem` produced
// a blank screen with no diagnostic.
//
// These wrappers match `storageService`'s contract for the
// localStorage side (see services/storageService.js) — the two
// storage layers now fail the same way. A caller that reaches one
// of these in a storage-blocked environment gets `null` from the
// read path and a silent no-op from the write path; the session
// simply does not survive a reload, which is the correct degraded
// behaviour.
function safeSessionGet(key) {
  try {
    return sessionStorage.getItem(key)
  } catch {
    return null
  }
}

function safeSessionSet(key, value) {
  try {
    sessionStorage.setItem(key, value)
  } catch {
    // Session state not persistable — the in-memory store still
    // carries the session for the current tab until navigation.
  }
}

function safeSessionRemove(key) {
  try {
    sessionStorage.removeItem(key)
  } catch {
    // Nothing to clean up if storage was never usable.
  }
}

function getService(mode) {
  return createTestService(mode)
}

export const useTestSessionStore = defineStore('testSession', {
  state: () => standardState({
    mode: null,
    sessionId: null,
    questionIds: [],
    currentIndex: 0,
    answers: {},
    confidence: {},
    tag: '',
    startedAt: null,
    accumulatedTime: 0,
    isActive: false,
    results: null,
    durationMinutes: null,
    blueprintId: null,
    ...subResourceState('submit'),
  }),
  getters: {
    ...standardGetters,
    ...subResourceGetters('submit'),
    totalQuestions: (state) => state.questionIds.length,
    isComplete: (state) => state.results !== null,
    answeredCount: (state) => Object.keys(state.answers).length,
    progress: (state) => {
      return state.totalQuestions > 0
        ? (state.answeredCount / state.totalQuestions) * 100
        : 0
    },
    currentQuestionId: (state) => state.questionIds[state.currentIndex] || null,
    currentConfidence: (state) => {
      const idx = state.currentIndex
      return normalizeConfidenceScore(state.confidence[idx])
    },
  },
  actions: {
    reset() {
      this._clearMemory()
      safeSessionRemove(SESSION_MODE_KEY)
      safeSessionRemove(SESSION_ID_KEY)
    },
    _clearMemory() {
      this.sessionId = null
      this.mode = null
      this.questionIds = []
      this.currentIndex = 0
      this.answers = {}
      this.confidence = {}
      this.tag = ''
      this.startedAt = null
      this.accumulatedTime = 0
      this.isActive = false
      this.results = null
      this.durationMinutes = null
      this.blueprintId = null
      this.status = 'idle'
      this.error = null
      this.submitStatus = 'idle'
      this.submitError = null
    },
    hydrateFromSession() {
      const savedMode = safeSessionGet(SESSION_MODE_KEY)
      const savedSessionId = safeSessionGet(SESSION_ID_KEY)
      if (!savedMode || !savedSessionId || !savedSessionId.trim()) return false
      if (!VALID_MODES.includes(savedMode)) return false
      if (this.mode && this.sessionId) return true
      this.mode = savedMode
      this.sessionId = savedSessionId
      return true
    },
    prepareForMode(mode) {
      if (this.mode !== mode) {
        this._clearMemory()
        this.mode = mode
      }
    },

    // ── start ────────────────────────────────────────────────────────
    //
    // Unified entry point for both exam and study.
    //
    // The backend accepts the full superset of selection parameters
    // for either mode; the only mode-sensitive behavior is downstream
    // (timer overtime, per-question explanations, reflection prompt),
    // all of which the backend decides from the `mode` path segment.
    //
    // REQUEST SHAPE
    // -------------
    //   • `tag`             — the tag FILTER value. Sent only when the
    //                         caller's source is a tag. The backend's
    //                         filter-builder reads this key.
    //   • `session_label`   — the display label persisted to
    //                         StudySession.tag and TestHistory.tag.
    //                         Sent for every source. Backend prefers
    //                         this over `tag` (see StartSessionView).
    //   • `category_ids`    — array of category ids (multi-select).
    //   • `use_bookmarks`   — restrict to the caller's bookmarks.
    //   • `use_srs`         — restrict to SRS-due questions.
    //   • `blueprint_id`    — weighted sampling by blueprint.
    //   • `difficulty`, `tags_filter`, `verified_only` — refinements.
    //   • `limit`           — cap on question count.
    //   • `disable_timer`   — client-side only. Not sent to the
    //                         backend. When true, forces the runner
    //                         into stopwatch mode by leaving
    //                         `durationMinutes` null even though the
    //                         backend returns a countdown value.
    //
    // MODE COMMIT SEMANTICS
    // ---------------------
    // `this.mode` is set inside `onSuccess`, not before the request.
    // A failed start leaves the store's previous mode untouched, so
    // the caller's sessionStorage and the store stay coherent.
    async start(mode, config) {
      const { wrap } = useCrudActions(this)
      const service = getService(mode)

      const requestPayload = {}
      if (config.tag) requestPayload.tag = config.tag
      if (config.session_label) requestPayload.session_label = config.session_label
      if (config.question_ids && config.question_ids.length) {
        requestPayload.question_ids = config.question_ids
      }
      if (config.blueprint_id) requestPayload.blueprint_id = config.blueprint_id
      if (config.use_srs) requestPayload.use_srs = true
      if (config.use_bookmarks) requestPayload.use_bookmarks = true
      if (config.category_ids && config.category_ids.length) {
        requestPayload.category_ids = config.category_ids
      }
      if (config.difficulty) requestPayload.difficulty = config.difficulty
      if (config.tags_filter) requestPayload.tags_filter = config.tags_filter
      if (config.verified_only) requestPayload.verified_only = true
      requestPayload.limit = config.limit || 200

      const sessionLabel = config.session_label
        || config.tag
        || i18n.global.t('tests.genericTag')

      return await wrap(() => service.start(requestPayload), {
        successMsg: null,
        errorMsgFallbackKey: 'notifications.sessionStartFailed',
        onSuccess: (res) => {
          if (!res.session_id) {
            throw new Error(i18n.global.t('tests.backendError'))
          }

          // Commit mode only on success.
          this.mode = mode
          this.sessionId = res.session_id
          this.questionIds = res.question_ids || []

          this.tag = res.tag ?? sessionLabel
          this.currentIndex = 0
          this.answers = {}
          this.confidence = {}
          const parsedStart = res.started_at ? new Date(res.started_at) : new Date()
          this.startedAt = isNaN(parsedStart.getTime()) ? new Date() : parsedStart
          this.accumulatedTime = 0
          this.isActive = true
          this.results = null
          this.blueprintId = res.blueprint || null

          // Timer decision:
          //   • config.disable_timer → force stopwatch (elapsed only).
          //   • res.duration_minutes  → countdown (backend supplied).
          //   • otherwise             → elapsed only.
          if (config.disable_timer && mode !== 'exam') {
            this.durationMinutes = null
          } else if (res.duration_minutes) {
            this.durationMinutes = Number(res.duration_minutes)
          } else {
            this.durationMinutes = null
          }

          safeSessionSet(SESSION_MODE_KEY, mode)
          safeSessionSet(SESSION_ID_KEY, res.session_id)
        },
      })
    },

    // ── startSRS ─────────────────────────────────────────────────────
    //
    // Thin wrapper for the legacy quick-action entry points
    // (Dashboard's SRS card). Delegates to start() with the SRS source
    // preset, mode forced to 'study', and the timer disabled so the
    // session reads as a relaxed review rather than a timed exam.
    //
    // Callers that construct an SRS session through UnifiedTestSetup
    // do NOT go through this method — they hit start() directly and
    // let the user's mode choice decide the timer behavior.
    async startSRS(limit = 20) {
      return this.start('study', {
        use_srs: true,
        limit,
        session_label: i18n.global.t('tests.smartReviewTag'),
        disable_timer: true,
      })
    },

    async fetchQuestion() {
      if (!this.isActive || this.currentIndex < 0 || this.currentIndex >= this.totalQuestions) {
        return null
      }
      const { wrap } = useCrudActions(this)
      const service = getService(this.mode)
      return await wrap(() => service.getQuestion(this.sessionId), {
        successMsg: null,
        errorMsgFallbackKey: 'notifications.questionLoadFailed',
      })
    },

    async submitAnswer(
      answer,
      action = 'next',
      targetIndex = null,
      confidence = null,
      errorReason = null,
      preAnswer = null,
    ) {
      if (!this.isActive) return null
      if (answer !== null && answer !== undefined) {
        const configStore = useConfigStore()
        const maxChoices = configStore.maxChoices || FALLBACK_MAX_CHOICES
        if (!Number.isInteger(answer) || answer < 1 || answer > maxChoices) {
          const err = new Error(i18n.global.t('tests.invalidAnswer', { max: maxChoices }))
          err.code = 400
          throw err
        }
      }
      const requestIndex = this.currentIndex
      this.submitStatus = 'loading'
      this.submitError = null
      try {
        const service = getService(this.mode)
        const response = await service.submitAnswer(
          this.sessionId,
          answer,
          action,
          targetIndex,
          confidence,
          errorReason,
          preAnswer,
        )
        if (answer !== undefined && answer !== null) {
          this.answers[requestIndex] = answer
          if (confidence !== null && confidence !== undefined) {
            this.confidence = {
              ...this.confidence,
              [requestIndex]: normalizeConfidenceScore(confidence),
            }
          }
        }
        if (action === 'next') {
          this.currentIndex = response.new_index ?? this.currentIndex + 1
        } else if (action === 'previous') {
          this.currentIndex = response.new_index ?? this.currentIndex - 1
        } else if (action === 'goto') {
          this.currentIndex = response.new_index ?? targetIndex
        }
        this.submitStatus = 'success'
        return response
      } catch (e) {
        const msg = e?.message || i18n.global.t('tests.answerSaveFailed')
        this.submitStatus = 'error'
        this.submitError = msg
        const outErr = new Error(msg)
        outErr.code = e?.code
        throw outErr
      }
    },

    async finish({ forced = false } = {}) {
      if (!this.isActive) return null
      if (!forced) {
        const { confirm } = useDialog()
        const unanswered = this.totalQuestions - this.answeredCount
        if (unanswered > 0) {
          const ok = await confirm(
            i18n.global.t('tests.unansweredWarning', { count: unanswered })
          )
          if (!ok) return null
        }
      }
      const { wrap } = useCrudActions(this)
      const service = getService(this.mode)
      return await wrap(() => service.finish(this.sessionId), {
        successMsg: null,
        errorMsgFallbackKey: 'notifications.resultsFetchFailed',
        onSuccess: (results) => {
          this.results = results
          this.isActive = false
          this.sessionId = null
          this.questionIds = []
          this.answers = {}
          this.confidence = {}
          this.currentIndex = 0
          this.startedAt = null
          this.accumulatedTime = 0
          safeSessionRemove(SESSION_MODE_KEY)
          safeSessionRemove(SESSION_ID_KEY)
        },
      })
    },

    async pause() {
      if (!this.isActive) return
      const { wrap } = useCrudActions(this)
      const service = getService(this.mode)
      if (!service.pause) return
      return await wrap(() => service.pause(this.sessionId), {
        successMsg: null,
        errorMsgFallbackKey: 'notifications.pauseFailed',
        onSuccess: () => {
          this.isActive = false
        },
      })
    },

    async resume() {
      if (!this.mode) {
        const savedMode = safeSessionGet(SESSION_MODE_KEY)
        const savedSessionId = safeSessionGet(SESSION_ID_KEY)
        if (savedMode) {
          this.mode = savedMode
          this.sessionId = savedSessionId
        }
      }
      if (!this.mode) return null
      const { wrap } = useCrudActions(this)
      const service = getService(this.mode)
      let res
      if (this.sessionId) {
        res = await wrap(() => service.resume(this.sessionId), {
          errorMsgFallbackKey: 'notifications.resumeFailed',
        })
      } else {
        res = await wrap(() => service.resume(null, this.mode), {
          errorMsgFallbackKey: 'notifications.resumeFailed',
        })
      }
      if (!res || !res.session_id) {
        return null
      }
      this.sessionId = res.session_id
      if (res.question_ids) {
        this._applySessionState(res, true)
      } else {
        const status = await wrap(() => service.status(res.session_id), {
          errorMsgFallbackKey: 'notifications.sessionStatusFailed',
        })
        if (!status) {
          return null
        }
        if (status.is_active) {
          this._applySessionState(status, true)
          this.sessionId = status.session_id
        } else {
          this.reset()
          return res
        }
      }
      safeSessionSet(SESSION_MODE_KEY, this.mode)
      safeSessionSet(SESSION_ID_KEY, this.sessionId)
      return res
    },

    async discardProgress() {
      if (!this.mode) {
        const savedMode = safeSessionGet(SESSION_MODE_KEY)
        if (savedMode) this.mode = savedMode
      }
      if (!this.mode) return
      const { wrap } = useCrudActions(this)
      const service = getService(this.mode)
      return await wrap(() => service.discardProgress(this.sessionId, this.mode), {
        errorMsgFallbackKey: 'notifications.progressDeleteFailed',
        onSuccess: () => this.reset(),
      })
    },

    async restoreFullState() {
      if (!this.mode) {
        const savedMode = safeSessionGet(SESSION_MODE_KEY)
        const savedSessionId = safeSessionGet(SESSION_ID_KEY)
        if (savedMode && savedSessionId) {
          this.mode = savedMode
          this.sessionId = savedSessionId
        }
      }
      if (!this.mode || !this.sessionId) return
      const { wrap } = useCrudActions(this)
      const service = getService(this.mode)
      if (!service.status) return
      return await wrap(() => service.status(this.sessionId), {
        errorMsgFallbackKey: 'notifications.sessionRestoreFailed',
        onSuccess: (status) => {
          if (!status) return
          this._applySessionState(status, Boolean(status.is_active))
          this.sessionId = status.session_id
        },
      })
    },

    _applySessionState(status, isActive = true) {
      this.questionIds = status.question_ids || []
      this.currentIndex = status.current_index ?? 0
      const rawAnswers = status.answers || {}
      const unpackedAnswers = {}
      const unpackedConfidence = {}
      for (const [idxStr, raw] of Object.entries(rawAnswers)) {
        const idx = Number(idxStr)
        if (raw && typeof raw === 'object' && raw.answer !== null && raw.answer !== undefined) {
          unpackedAnswers[idx] = raw.answer
          if (raw.confidence_provided !== false) {
            unpackedConfidence[idx] = normalizeConfidenceScore(raw.confidence)
          }
        } else if (raw !== null && typeof raw !== 'object') {
          unpackedAnswers[idx] = raw
          unpackedConfidence[idx] = 3
        }
      }
      this.answers = unpackedAnswers
      this.confidence = unpackedConfidence
      this.tag = status.tag || ''
      if (status.started_at) {
        const parsedDate = new Date(status.started_at)
        this.startedAt = isNaN(parsedDate.getTime()) ? null : parsedDate
      } else {
        this.startedAt = null
      }
      this.accumulatedTime = status.accumulated_time || 0
      this.isActive = isActive
      this.results = null
      this.durationMinutes = status.duration_minutes ?? null
    },

    goToQuestion(index) {
      if (Number.isInteger(index) && index >= 0 && index < this.totalQuestions) {
        this.currentIndex = index
      }
    },
    hasAnswer(index) {
      return this.answers[index] !== undefined && this.answers[index] !== null
    },
  },
})

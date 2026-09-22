// frontend/src/stores/masterExamAttemptStore.js
import { defineStore } from 'pinia'
import { masterExamService } from '@/services/masterExamService'
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


// The code travels in TWO places on the wire:
//
//   1. `details.code` — the structured, locale-independent signal.
//      This is the primary contract (see
//      MasterExamSubmitAnswerView._attempt_error_details in the
//      backend). It survives i18n of the human-readable message.
//
//   2. The raw `message` string — kept as a fallback for any older
//      backend that still surfaces the code verbatim. The current
//      backend does NOT rely on this path, but the fallback is
//      retained so a mixed-version deploy cannot silently lose
//      the recovery.
export const TIME_EXPIRED_CODE = 'TIME_EXPIRED'

function isTimeExpiredError(err) {
  if (!err) return false
  // Primary signal: structured code carried in `details.code` by
  // MasterExamSubmitAnswerView. Preferred because it survives i18n
  // of the human-readable message — the previous implementation
  // only looked at the message string, which _map_attempt_error
  // had already replaced with Arabic text.
  if (err.details && err.details.code === TIME_EXPIRED_CODE) return true
  // Fallback for any backend that still surfaces the code in the
  // message string.
  const msg = typeof err.message === 'string' ? err.message : ''
  return msg.includes(TIME_EXPIRED_CODE)
}

// ──────────────────────────────────────────────────────────────────
// In-flight answer map, keyed on question id.
//
// `submitAnswer` performs an optimistic write into `this.answers`
// before awaiting the server, and reverts to the captured `previous`
// value on failure. Two rapid calls for the same question — a
// double-click on a radio, or a rapid keyboard `1`-`2` on the same
// question before the first round trip resolves — used to corrupt
// the revert path in exactly the same way `questionStore.toggleVerify`
// did:
//
//   • Call 1 captures previous = the true pre-answer value.
//   • Call 2 captures previous = call 1's optimistic value.
//   • Both requests land. The server processes them in arrival order;
//     its final state is call 2's answer. If call 1's failure
//     handler runs after call 2's success, the revert writes call 1's
//     captured (pre-answer) value and the local state disagrees with
//     the server until the next poll.
//
// The map below keys on question id. The second call returns the
// first call's promise unchanged, so exactly one request fires per
// question per in-flight window and the revert path only ever sees
// the true pre-answer value.
//
// KEYED ON QUESTION ID (not on current question): the runner
// advances `currentQuestionId` inside the success handler, so a
// value-only guard would have been insufficient — the user can
// double-click, advance, come back, and click again while the first
// request is still on the wire.
const _pendingAnswers = new Map()

export const useMasterExamAttemptStore = defineStore('masterExamAttempt', {
  state: () => standardState({
    examId: null,
    examName: '',
    examInstructions: '',
    durationMinutes: 0,
    graceSeconds: 180,

    sessionId: null,
    attemptId: null,
    isPreview: false,
    isMakeup: false,

    questionIds: [],
    currentQuestionId: null,
    currentQuestion: null,

    answers: {},

    previewQuestions: {},
    previewFeedback: null,

    serverOffsetMs: 0,
    startedAt: null,
    deadlineAt: null,
    finishedAt: null,

    result: null,
    previewFinished: false,

    ...subResourceState('answer'),
    ...subResourceState('poll'),
  }),

  getters: {
    ...standardGetters,
    ...subResourceGetters('answer'),
    ...subResourceGetters('poll'),

    totalQuestions: (state) => state.questionIds.length,
    answeredCount: (state) => Object.keys(state.answers).length,
    isComplete: (state) => !!state.finishedAt,

    remainingMs: (state) => {
      if (!state.deadlineAt) return null
      const serverNow = Date.now() + state.serverOffsetMs
      return Math.max(0, new Date(state.deadlineAt).getTime() - serverNow)
    },

    isExpired: (state) => {
      if (!state.deadlineAt) return false
      const serverNow = Date.now() + state.serverOffsetMs
      return serverNow >= new Date(state.deadlineAt).getTime()
    },

    inGraceWindow: (state) => {
      if (!state.deadlineAt) return false
      const serverNow = Date.now() + state.serverOffsetMs
      const deadlineMs = new Date(state.deadlineAt).getTime()
      const graceMs = (state.graceSeconds || 180) * 1000
      return serverNow >= deadlineMs && serverNow < deadlineMs + graceMs
    },

    currentIndex: (state) => {
      return state.questionIds.indexOf(state.currentQuestionId)
    },
  },

  actions: {

    async start(examId, { preview = false } = {}) {
      this.reset()

      const { wrap } = useCrudActions(this)
      return await wrap(
        () => masterExamService.startAttempt(examId, { preview }),
        {
          successMsg: null,
          errorMsgFallbackKey: 'masterExams.startFailed',
          onSuccess: (res) => {
            this.examId = examId
            this.sessionId = res.session_id
            this.attemptId = res.id || null
            this.isPreview = !!res.is_preview
            this.isMakeup = !!res.is_makeup
            this.examName = res.exam_name || ''
            this.questionIds = res.question_ids || []
            this.answers = res.answers || {}
            this.currentQuestionId = res.current_question_id || (this.questionIds[0] ?? null)
            this.durationMinutes = res.duration_minutes || 0
            this.graceSeconds = res.grace_seconds || 180

            if (this.isPreview && Array.isArray(res.questions)) {
              const map = {}
              for (const q of res.questions) {
                map[q.id] = q
              }
              this.previewQuestions = map
            }

            if (res.started_at) {
              this.startedAt = new Date(res.started_at)
            }
            if (res.deadline_at) {
              this.deadlineAt = new Date(res.deadline_at)
            } else {
              this.deadlineAt = null
            }

            if (!this.isPreview && this.deadlineAt) {
              this._syncServerOffset()
            }
          },
        },
      )
    },

    // ── hydrateFromExam ─────────────────────────────────────────────
    //
    // Direct writes bypassed the action layer that every other store
    // in the app follows (compare `_applySessionState` and the
    // `onSuccess` blocks above). This action restores the convention
    // and makes the hydration testable in isolation.
    //
    // GUARD FIDELITY. The two `|| ...` guards on `examInstructions`
    // and `questionIds` are kept because the ORIGINAL CALLER had them
    // inline — they are part of the caller's contract, not the
    // store's. No guards are added on `examName` or `durationMinutes`
    // because the original caller assigned those verbatim, and a
    // future reader comparing the two should see the same surface.
    //
    // `graceSeconds` is parameterized because the runner supplies it
    // explicitly (as a literal `180` today), which keeps the default
    // here identical to what the caller used to write.
    hydrateFromExam(exam, { graceSeconds = 180 } = {}) {
      if (!exam) return
      this.examName = exam.name
      this.examInstructions = exam.instructions || ''
      this.durationMinutes = exam.duration_minutes
      this.questionIds = exam.question_ids || []
      this.graceSeconds = graceSeconds
    },

    async _syncServerOffset() {
      try {
        const status = await masterExamService.attemptStatus(this.examId)
        if (status.server_now) {
          const serverNow = new Date(status.server_now).getTime()
          this.serverOffsetMs = serverNow - Date.now()
        }
      } catch {
      }
    },

    async fetchCurrentQuestion() {
      if (this.isPreview) {
        const qid = this.currentQuestionId
        const q = this.previewQuestions[qid]
        if (!q) {
          this.currentQuestion = null
          return null
        }
        this.currentQuestion = {
          id: q.id,
          text: q.text,
          choices: q.choices,
          image_url: q.image_url,
          case: q.case || null,
        }
        this.previewFeedback = null
        return { question: this.currentQuestion }
      }

      const { wrap } = useCrudActions(this)
      return await wrap(() => masterExamService.attemptQuestion(this.examId), {
        suppressErrorToast: true,
        onSuccess: (payload) => {
          this.currentQuestion = payload.question
          this.currentQuestionId = payload.question.id

          if (payload.saved_answer != null) {
            this.answers = {
              ...this.answers,
              [String(payload.question.id)]: {
                answer: payload.saved_answer,
                confidence: payload.saved_confidence !== false,
              },
            }
          }
        },
      })
    },

    // ── submitAnswer (with in-flight dedup) ────────────────────────
    //
    // A second call for the same question while the first is still
    // pending returns the first call's promise. See the module-level
    // comment on `_pendingAnswers` for the failure mode this
    // prevents.
    async submitAnswer(answer, confidence = true) {
      if (!this.currentQuestionId) return null
      const questionId = this.currentQuestionId

      if (_pendingAnswers.has(questionId)) {
        return _pendingAnswers.get(questionId)
      }

      const promise = this._executeSubmitAnswer(questionId, answer, confidence)
      _pendingAnswers.set(questionId, promise)
      try {
        return await promise
      } finally {
        _pendingAnswers.delete(questionId)
      }
    },

    async _executeSubmitAnswer(questionId, answer, confidence) {
      const previous = this.answers[String(questionId)]

      this.answers = {
        ...this.answers,
        [String(questionId)]: { answer, confidence },
      }

      if (this.isPreview) {
        const q = this.previewQuestions[questionId]
        if (q) {
          this.previewFeedback = {
            isCorrect: answer === q.correct_answer,
            correctAnswer: q.correct_answer,
            explanation: q.explanation || '',
            selectedAnswer: answer,
          }
        }
        return { success: true, current_question_id: questionId }
      }

      const { wrap } = useCrudActions(this, {
        statusKey: 'answerStatus',
        errorKey: 'answerError',
      })
      const result = await wrap(
        () => masterExamService.submitAnswer(this.examId, {
          questionId,
          answer,
          confidence,
        }),
        {
          successMsg: null,
          errorMsgFallbackKey: 'masterExams.saveAnswerFailed',
          onSuccess: (res) => {
            if (res && res.current_question_id !== undefined) {
              this.currentQuestionId = res.current_question_id
            }
          },
          onError: (err) => {
            // Revert the optimistic answer.
            const reverted = { ...this.answers }
            if (previous === undefined) {
              delete reverted[String(questionId)]
            } else {
              reverted[String(questionId)] = previous
            }
            this.answers = reverted

            //
            // `finishedAt` is the state field; `isComplete` is a
            // getter derived from it. Setting `finishedAt` alone is
            // the correct and sufficient action — the runner's
            // watcher on `isComplete` reads it.
            if (isTimeExpiredError(err)) {
              this.finishedAt = new Date()
            }
          },
        },
      )
      return result
    },

    async goto(questionId) {
      if (this.isPreview) {
        if (!this.questionIds.includes(questionId)) {
          return null
        }
        this.currentQuestionId = questionId
        this.previewFeedback = null
        return { current_question_id: questionId }
      }

      const { wrap } = useCrudActions(this)
      return await wrap(
        () => masterExamService.gotoQuestion(this.examId, questionId),
        {
          successMsg: null,
          errorMsgFallbackKey: 'masterExams.navigateFailed',
          onSuccess: (res) => {
            if (res && res.current_question_id !== undefined) {
              this.currentQuestionId = res.current_question_id
            }
          },
        },
      )
    },

    async flagCurrentQuestion(reason = '') {
      if (!this.currentQuestionId) return null

      if (this.isPreview) {
        const { notify } = useNotify()
        notify(i18n.global.t('masterExams.runnerPreviewFlagNoop'), 'info')
        return { success: false, preview: true }
      }

      const { wrap } = useCrudActions(this)
      return await wrap(
        () => masterExamService.flagQuestion(this.examId, {
          questionId: this.currentQuestionId,
          reason,
        }),
        {
          successMsgKey: 'notifications.masterExamFlagged',
          errorMsgFallbackKey: 'masterExams.flagFailed',
        },
      )
    },

    async finish() {
      if (this.isPreview) {
        this.previewFinished = true
        this.finishedAt = new Date()
        return { preview: true }
      }

      const { wrap } = useCrudActions(this)
      return await wrap(() => masterExamService.finishAttempt(this.examId), {
        successMsg: null,
        errorMsgFallbackKey: 'masterExams.runnerFinishFailed',
        onSuccess: (attempt) => {
          this.result = attempt
          this.finishedAt = new Date()
        },
      })
    },

    async pollStatus() {
      if (!this.examId || this.isPreview) return null
      const { wrap } = useCrudActions(this, {
        statusKey: 'pollStatus',
        errorKey: 'pollError',
      })
      return await wrap(() => masterExamService.attemptStatus(this.examId), {
        suppressErrorToast: true,
        onSuccess: (status) => {
          if (!status) return

          if (Array.isArray(status.question_ids)) {
            this.questionIds = status.question_ids
          }

          if (status.server_now) {
            const serverNow = new Date(status.server_now).getTime()
            this.serverOffsetMs = serverNow - Date.now()
          }

          if (status.is_complete && !this.finishedAt) {
            this.finishedAt = new Date()
          }

          if (status.current_question_id !== undefined) {
            this.currentQuestionId = status.current_question_id
          }
        },
      })
    },

    reset: makeReset({
      examId: null,
      examName: '',
      examInstructions: '',
      durationMinutes: 0,
      graceSeconds: 180,
      sessionId: null,
      attemptId: null,
      isPreview: false,
      isMakeup: false,
      questionIds: [],
      currentQuestionId: null,
      currentQuestion: null,
      answers: {},
      previewQuestions: {},
      previewFeedback: null,
      serverOffsetMs: 0,
      startedAt: null,
      deadlineAt: null,
      finishedAt: null,
      result: null,
      previewFinished: false,
      answerStatus: 'idle',
      answerError: null,
      pollStatus: 'idle',
      pollError: null,
      status: 'idle',
      error: null,
    }),
  },
})
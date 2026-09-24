import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useTestSessionStore } from '@/stores/testSessionStore'
import { usePreferencesStore } from '@/stores/preferencesStore'
import { useAnswerSubmission } from '@/composables/useAnswerSubmission'
import { useTestNavigation } from '@/composables/useTestNavigation'
import { useNotify } from '@/composables/useNotify'
import { useDialog } from '@/composables/useDialog'
import { useSound } from '@/composables/useSound'
import { i18n } from '@/i18n'

export function useTestQuestionController(modeRef) {
  const router = useRouter()
  const store = useTestSessionStore()
  const preferencesStore = usePreferencesStore()
  const { notify } = useNotify()
  const { confirm } = useDialog()
  const { playClick } = useSound()
  const { submitting, submitAnswer } = useAnswerSubmission(store)
  const t = i18n.global.t

  const mode = () => (typeof modeRef === 'function' ? modeRef() : modeRef.value)

  const question = ref(null)
  const selectedAnswer = ref(null)
  const startTime = ref(null)
  const swipeContainer = ref(null)
  const confidence = ref(null)
  const preAnswer = ref('')
  const choicesRevealed = ref(false)
  const showReflectionPrompt = ref(false)
  const awaitingReflection = ref(false)
  const interactionBusy = ref(false)
  const questionLoadFailed = ref(false)
  const tickedRemaining = ref(null)

  let autoFinishTriggered = false
  let advanceTimer = null
  let pendingSubmission = null
  const finishing = ref(false)

  const examTotalSeconds = computed(() => {
    if (['exam', 'study', 'recall'].includes(mode()) && store.durationMinutes) {
      return store.durationMinutes * 60
    }
    return null
  })

  const isCritical = computed(() => {
    if (examTotalSeconds.value === null || tickedRemaining.value === null) {
      return false
    }
    if (tickedRemaining.value <= 0) return false
    return tickedRemaining.value / examTotalSeconds.value <= 0.1
  })

  const confidenceForCurrent = computed(() => {
    const stored = store.confidence[store.currentIndex]
    if (stored !== undefined) return stored
    return mode() === 'exam' ? 3 : null
  })

  const needsConfidence = computed(() => (
    (mode() === 'study' || mode() === 'recall')
    && selectedAnswer.value !== null
    && selectedAnswer.value !== undefined
    && confidence.value === null
  ))

  const navigationDisabled = computed(() => (
    submitting.value
    || interactionBusy.value
    || finishing.value
    || awaitingReflection.value
    || needsConfidence.value
  ))
  const answerControlsBusy = computed(() => (
    submitting.value || interactionBusy.value || finishing.value
  ))

  function onTimerTick({ remaining }) {
    tickedRemaining.value = remaining
  }

  function track(promise) {
    pendingSubmission = promise
    return promise
  }

  function clearAdvanceTimer() {
    if (!advanceTimer) return
    clearTimeout(advanceTimer)
    advanceTimer = null
  }

  function handleSubmissionFailure(error, fallbackKey) {
    if (error?.code === 409 && mode() === 'exam') {
      if (!autoFinishTriggered) {
        autoFinishTriggered = true
        notify(t('tests.timeUp'), 'warning')
      }
      finish({ forced: true })
      return
    }
    notify(error?.message || t(fallbackKey), 'error')
  }

  function mergeFeedbackTranslations(translations) {
    if (!question.value || !translations || typeof translations !== 'object') return
    const current = question.value.translations || {}
    question.value.translations = Object.fromEntries(
      Object.entries({ ...current, ...translations }).map(([locale, content]) => [
        locale,
        { ...(current[locale] || {}), ...(content || {}) },
      ]),
    )
  }

  function maybeScheduleAdvance(questionId, delay = 400) {
    if (!preferencesStore.autoAdvance) return
    if (awaitingReflection.value || needsConfidence.value) return
    scheduleAdvance(questionId, delay)
  }

  async function loadQuestion() {
    if (store.isComplete) {
      router.push(`/${mode()}/results`)
      return
    }

    questionLoadFailed.value = false
    const response = await store.fetchQuestion()
    if (!response) {
      if (store.status === 'error') {
        question.value = null
        questionLoadFailed.value = true
        return
      }
      if (!store.isComplete) await finish()
      else router.push(`/${mode()}/results`)
      return
    }

    question.value = response.question
    selectedAnswer.value = store.answers[store.currentIndex] || null
    confidence.value = response.saved_confidence ?? confidenceForCurrent.value
    preAnswer.value = response.saved_pre_answer || ''
    choicesRevealed.value = mode() !== 'recall' || !response.question?.choices_hidden
    showReflectionPrompt.value = false
    awaitingReflection.value = false

    const baseMs = store.startedAt ? new Date(store.startedAt).getTime() : Date.now()
    const accumulatedMs = (store.accumulatedTime || 0) * 1000
    startTime.value = new Date(baseMs - accumulatedMs)
  }

  async function handleConfidence(value) {
    if (interactionBusy.value || submitting.value) return
    const previousConfidence = confidence.value
    confidence.value = value
    if (selectedAnswer.value === null || selectedAnswer.value === undefined) {
      return
    }

    const submittedQuestionId = store.currentQuestionId
    interactionBusy.value = true
    try {
      await track(submitAnswer(selectedAnswer.value, 'same', null, value))
    } catch (error) {
      confidence.value = previousConfidence
      handleSubmissionFailure(error, 'tests.confidenceSaveFailed')
      return
    } finally {
      interactionBusy.value = false
    }
    maybeScheduleAdvance(submittedQuestionId)
  }

  function handleAnswer(answer) {
    if (interactionBusy.value || submitting.value || awaitingReflection.value) return
    selectedAnswer.value = answer
    showReflectionPrompt.value = false
    awaitingReflection.value = false
    if (preferencesStore.soundEffects) playClick()
    saveAnswer()
  }

  async function handleReveal(value) {
    const clean = String(value || '').trim()
    if (!clean || submitting.value || interactionBusy.value) return
    interactionBusy.value = true
    try {
      await track(submitAnswer(null, 'same', null, confidence.value, null, clean))
      await loadQuestion()
    } catch (error) {
      handleSubmissionFailure(error, 'tests.recallSaveFailed')
    } finally {
      interactionBusy.value = false
    }
  }

  function scheduleAdvance(questionId, delay) {
    clearAdvanceTimer()
    advanceTimer = setTimeout(() => {
      advanceTimer = null
      if (awaitingReflection.value) return
      if (store.currentQuestionId !== questionId) return
      if (store.currentIndex < store.totalQuestions - 1) goNext()
      else finish()
    }, delay)
  }

  async function handleReflection(reason) {
    if (selectedAnswer.value === null || selectedAnswer.value === undefined) {
      return
    }
    if (interactionBusy.value || submitting.value) return

    const submittedQuestionId = store.currentQuestionId
    interactionBusy.value = true
    try {
      await track(submitAnswer(selectedAnswer.value, 'same', null, confidence.value, reason))
    } catch (error) {
      handleSubmissionFailure(error, 'tests.reflectionSaveFailed')
      return
    } finally {
      interactionBusy.value = false
    }

    awaitingReflection.value = false
    showReflectionPrompt.value = false
    maybeScheduleAdvance(submittedQuestionId)
  }

  async function saveAnswer() {
    if (interactionBusy.value || submitting.value) return
    clearAdvanceTimer()
    const submittedValue = selectedAnswer.value
    const submittedConfidence = confidence.value
    const submittedQuestionId = store.currentQuestionId
    let response

    interactionBusy.value = true
    try {
      response = await track(submitAnswer(submittedValue, 'same', null, submittedConfidence))
    } catch (error) {
      selectedAnswer.value = store.answers[store.currentIndex] ?? null
      handleSubmissionFailure(error, 'tests.answerSaveFailed')
      return
    } finally {
      interactionBusy.value = false
    }

    if ((mode() === 'study' || mode() === 'recall') && response) {
      if (response.explanation) question.value.explanation = response.explanation
      mergeFeedbackTranslations(response.feedback_translations)
      if (response.is_correct === false) {
        showReflectionPrompt.value = true
        awaitingReflection.value = true
      }
    }

    if (
      preferencesStore.autoAdvance &&
      !awaitingReflection.value &&
      !needsConfidence.value &&
      selectedAnswer.value === submittedValue &&
      store.currentQuestionId === submittedQuestionId
    ) {
      scheduleAdvance(submittedQuestionId, 600)
    }
  }

  async function goNext() {
    if (navigationDisabled.value) return
    clearAdvanceTimer()
    if (store.currentIndex >= store.totalQuestions - 1) {
      await finish()
      return
    }

    interactionBusy.value = true
    try {
      await track(submitAnswer(selectedAnswer.value, 'next', null, confidence.value))
      await loadQuestion()
    } catch (error) {
      handleSubmissionFailure(error, 'tests.answerSaveFailed')
      return
    } finally {
      interactionBusy.value = false
    }
  }

  async function goPrevious() {
    if (navigationDisabled.value) return
    clearAdvanceTimer()
    interactionBusy.value = true
    try {
      await track(submitAnswer(null, 'previous'))
      await loadQuestion()
    } catch (error) {
      handleSubmissionFailure(error, 'tests.navigationFailed')
      return
    } finally {
      interactionBusy.value = false
    }
  }

  async function goTo(index) {
    if (index === store.currentIndex || navigationDisabled.value) return
    clearAdvanceTimer()
    interactionBusy.value = true
    try {
      await track(submitAnswer(selectedAnswer.value, 'goto', index, confidence.value))
      await loadQuestion()
    } catch (error) {
      handleSubmissionFailure(error, 'tests.navigationFailed')
      return
    } finally {
      interactionBusy.value = false
    }
  }

  async function pauseSession() {
    if (navigationDisabled.value) return
    if (!(await confirm(t('tests.pauseConfirm')))) return
    const result = await store.pause()
    if (result) router.push(`/${mode()}`)
  }

  async function finish({ forced = false } = {}) {
    if (finishing.value || (!forced && navigationDisabled.value)) return
    finishing.value = true
    try {
      clearAdvanceTimer()
      if (pendingSubmission) {
        try {
          await pendingSubmission
        } catch {
          // The initiating action already surfaces submission failures.
        }
        pendingSubmission = null
      }

      const result = await store.finish({ forced })
      if (result) router.push(`/${mode()}/results`)
    } catch (error) {
      notify(error?.message || t('tests.finishFailed'), 'error')
    } finally {
      finishing.value = false
    }
  }

  const { setup: setupNavigation, cleanup: cleanupNavigation } = useTestNavigation({
    onNext: goNext,
    onPrevious: goPrevious,
    onAnswer: handleAnswer,
    onFinish: () => {
      if (!finishing.value) finish()
    },
    enabled: () => !navigationDisabled.value,
  })

  watch(tickedRemaining, (remaining) => {
    if (remaining === null || remaining > 0 || mode() !== 'exam') return
    if (autoFinishTriggered) return
    autoFinishTriggered = true
    notify(t('tests.timeUp'), 'warning')
    finish({ forced: true })
  })

  onMounted(async () => {
    if (!store.isActive && !store.questionIds?.length) {
      await store.restoreFullState?.()
      if (!store.isActive) {
        router.push(`/${mode()}`)
        return
      }
    }
    await loadQuestion()
    if (swipeContainer.value) setupNavigation(swipeContainer.value)
  })

  onBeforeUnmount(() => {
    clearAdvanceTimer()
    if (swipeContainer.value) cleanupNavigation(swipeContainer.value)
  })

  return {
    store,
    question,
    selectedAnswer,
    confidence,
    startTime,
    swipeContainer,
    showReflectionPrompt,
    questionLoadFailed,
    submitting,
    navigationDisabled,
    answerControlsBusy,
    examTotalSeconds,
    isCritical,
    confidenceForCurrent,
    preAnswer,
    choicesRevealed,
    onTimerTick,
    retryLoadQuestion: loadQuestion,
    handleAnswer,
    handleConfidence,
    handleReveal,
    handleReflection,
    goNext,
    goPrevious,
    goTo,
    pauseSession,
    finish,
  }
}

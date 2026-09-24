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
  const confidence = ref(3)
  const preAnswer = ref('')
  const choicesRevealed = ref(false)
  const showReflectionPrompt = ref(false)
  const awaitingReflection = ref(false)
  const tickedRemaining = ref(null)

  let autoFinishTriggered = false
  let advanceTimer = null
  let pendingSubmission = null
  let finishing = false

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
    return stored === undefined ? 3 : stored
  })

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

  function clearQuestionFeedback() {
    clearAdvanceTimer()
    showReflectionPrompt.value = false
    awaitingReflection.value = false
  }

  async function loadQuestion() {
    if (store.isComplete) {
      router.push(`/${mode()}/results`)
      return
    }

    const response = await store.fetchQuestion()
    if (!response) {
      if (!store.isComplete) await finish()
      else router.push(`/${mode()}/results`)
      return
    }

    question.value = response.question
    selectedAnswer.value = store.answers[store.currentIndex] || null
    confidence.value = confidenceForCurrent.value
    preAnswer.value = response.saved_pre_answer || ''
    choicesRevealed.value = mode() !== 'recall' || !response.question?.choices_hidden
    showReflectionPrompt.value = false
    awaitingReflection.value = false

    const baseMs = store.startedAt ? new Date(store.startedAt).getTime() : Date.now()
    const accumulatedMs = (store.accumulatedTime || 0) * 1000
    startTime.value = new Date(baseMs - accumulatedMs)
  }

  async function handleConfidence(value) {
    confidence.value = value
    if (selectedAnswer.value === null || selectedAnswer.value === undefined) {
      return
    }

    try {
      await track(submitAnswer(selectedAnswer.value, 'same', null, value))
    } catch (error) {
      notify(error?.message || t('tests.confidenceSaveFailed'), 'error')
    }
  }

  function handleAnswer(answer) {
    selectedAnswer.value = answer
    showReflectionPrompt.value = false
    awaitingReflection.value = false
    if (preferencesStore.soundEffects) playClick()
    saveAnswer()
  }

  async function handleReveal(value) {
    const clean = String(value || '').trim()
    if (!clean || submitting.value) return
    try {
      await track(submitAnswer(null, 'same', null, confidence.value, null, clean))
      await loadQuestion()
    } catch (error) {
      notify(error?.message || t('tests.recallSaveFailed'), 'error')
    }
  }

  function scheduleAdvance(questionId, delay) {
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

    const submittedQuestionId = store.currentQuestionId
    try {
      await track(submitAnswer(selectedAnswer.value, 'same', null, confidence.value, reason))
    } catch (error) {
      notify(error?.message || t('tests.reflectionSaveFailed'), 'error')
      return
    }

    awaitingReflection.value = false
    showReflectionPrompt.value = false
    if (preferencesStore.autoAdvance) {
      scheduleAdvance(submittedQuestionId, 400)
    }
  }

  async function saveAnswer() {
    clearAdvanceTimer()
    const submittedValue = selectedAnswer.value
    const submittedConfidence = confidence.value
    const submittedQuestionId = store.currentQuestionId
    let response

    try {
      response = await track(submitAnswer(submittedValue, 'same', null, submittedConfidence))
    } catch (error) {
      notify(error?.message || t('tests.answerSaveFailed'), 'error')
      return
    }

    if ((mode() === 'study' || mode() === 'recall') && response) {
      if (response.explanation) question.value.explanation = response.explanation
      if (response.is_correct === false) {
        showReflectionPrompt.value = true
        awaitingReflection.value = true
      }
    }

    if (
      preferencesStore.autoAdvance &&
      !awaitingReflection.value &&
      selectedAnswer.value === submittedValue &&
      store.currentQuestionId === submittedQuestionId
    ) {
      scheduleAdvance(submittedQuestionId, 600)
    }
  }

  async function goNext() {
    clearQuestionFeedback()
    if (store.currentIndex >= store.totalQuestions - 1) {
      await finish()
      return
    }

    try {
      await track(submitAnswer(selectedAnswer.value, 'next', null, confidence.value))
    } catch (error) {
      notify(error?.message || t('tests.answerSaveFailed'), 'error')
      return
    }
    await loadQuestion()
  }

  async function goPrevious() {
    clearQuestionFeedback()
    try {
      await track(submitAnswer(null, 'previous'))
    } catch (error) {
      notify(error?.message || t('tests.navigationFailed'), 'error')
      return
    }
    await loadQuestion()
  }

  async function goTo(index) {
    if (index === store.currentIndex) return
    clearQuestionFeedback()
    try {
      await track(submitAnswer(selectedAnswer.value, 'goto', index, confidence.value))
    } catch (error) {
      notify(error?.message || t('tests.navigationFailed'), 'error')
      return
    }
    await loadQuestion()
  }

  async function pauseSession() {
    if (!(await confirm(t('tests.pauseConfirm')))) return
    const result = await store.pause()
    if (result) router.push(`/${mode()}`)
  }

  async function finish({ forced = false } = {}) {
    if (finishing) return
    finishing = true
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
      finishing = false
    }
  }

  const { setup: setupNavigation, cleanup: cleanupNavigation } = useTestNavigation({
    onNext: goNext,
    onPrevious: goPrevious,
    onAnswer: (answer) => {
      selectedAnswer.value = answer
      handleAnswer(answer)
    },
    onFinish: () => {
      if (!finishing) finish()
    },
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
    startTime,
    swipeContainer,
    showReflectionPrompt,
    submitting,
    examTotalSeconds,
    isCritical,
    confidenceForCurrent,
    preAnswer,
    choicesRevealed,
    onTimerTick,
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

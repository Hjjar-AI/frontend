import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useMasterExamStore } from '@/stores/masterExamStore'
import { useMasterExamAttemptStore } from '@/stores/masterExamAttemptStore'
import { useDialog } from '@/composables/useDialog'
import { useAutoRefresh } from '@/composables/useAutoRefresh'
import { formatTime } from '@/utils/timer'

export function useMasterExamRunner() {
  const { t } = useI18n()
  const route = useRoute()
  const router = useRouter()
  const masterExamStore = useMasterExamStore()
  const attemptStore = useMasterExamAttemptStore()
  const { confirm, prompt: promptDialog } = useDialog()

  const examId = computed(() => Number(route.params.id))
  const isPreview = computed(() => route.query.preview === '1')
  const showPreStart = ref(true)
  const preCountdownActive = ref(false)
  const preCountdownValue = ref(5)
  const finishing = ref(false)
  let preCountdownTimer = null
  let timerInterval = null

  const currentIndex = computed(() => attemptStore.currentIndex)
  const answerSubmitting = computed(() => attemptStore.isAnswerLoading)
  const currentSavedAnswer = computed(() => {
    const raw = attemptStore.answers[String(attemptStore.currentQuestionId)]
    return raw ? raw.answer : null
  })

  const currentConfidence = ref(true)
  watch(
    currentSavedAnswer,
    () => {
      const raw = attemptStore.answers[String(attemptStore.currentQuestionId)]
      currentConfidence.value = raw ? raw.confidence !== false : true
    },
    { immediate: true },
  )

  const nowTick = ref(Date.now())
  const remainingMs = computed(() => {
    if (!attemptStore.deadlineAt) return null
    const serverNow = nowTick.value + attemptStore.serverOffsetMs
    return Math.max(0, new Date(attemptStore.deadlineAt).getTime() - serverNow)
  })
  const graceMs = computed(() => {
    if (!attemptStore.deadlineAt) return null
    const serverNow = nowTick.value + attemptStore.serverOffsetMs
    const deadline = new Date(attemptStore.deadlineAt).getTime()
    const grace = (attemptStore.graceSeconds || 180) * 1000
    return Math.max(0, deadline + grace - serverNow)
  })
  const timerDisplay = computed(() => {
    if (remainingMs.value === null) return '—'
    return formatTime(Math.floor(remainingMs.value / 1000))
  })
  const graceDisplay = computed(() => {
    if (graceMs.value === null) return '00:00'
    return formatTime(Math.floor(graceMs.value / 1000))
  })
  const timerClass = computed(() => {
    if (remainingMs.value === null) return ''
    const totalMs = (attemptStore.durationMinutes || 30) * 60 * 1000
    const ratio = remainingMs.value / totalMs
    if (attemptStore.inGraceWindow) return 'master-exam-runner__timer--grace'
    if (ratio <= 0.1) return 'master-exam-runner__timer--critical'
    if (ratio <= 0.2) return 'master-exam-runner__timer--warning'
    return ''
  })

  async function loadCurrent() {
    await attemptStore.fetchCurrentQuestion()
  }

  async function doStart() {
    const result = await attemptStore.start(examId.value, { preview: isPreview.value })
    if (!result) {
      router.push('/master-exams')
      return
    }
    await loadCurrent()
  }

  function beginCountdown() {
    if (preCountdownTimer) clearInterval(preCountdownTimer)
    showPreStart.value = false
    preCountdownActive.value = true
    preCountdownValue.value = 5
    let value = 5
    preCountdownTimer = setInterval(() => {
      value -= 1
      preCountdownValue.value = value
      if (value <= 0) {
        clearInterval(preCountdownTimer)
        preCountdownTimer = null
        preCountdownActive.value = false
        doStart()
      }
    }, 1000)
  }

  function cancelCountdown() {
    if (preCountdownTimer) {
      clearInterval(preCountdownTimer)
      preCountdownTimer = null
    }
    preCountdownActive.value = false
    showPreStart.value = true
  }

  function exitAttempt() {
    router.push('/master-exams')
  }

  async function onSelectAnswer(answer) {
    if (answerSubmitting.value) return
    await attemptStore.submitAnswer(answer, currentConfidence.value)
  }

  async function onConfidenceChange(confidence) {
    currentConfidence.value = confidence
    const raw = attemptStore.answers[String(attemptStore.currentQuestionId)]
    if (raw?.answer && !answerSubmitting.value) {
      await attemptStore.submitAnswer(raw.answer, currentConfidence.value)
    }
  }

  async function gotoQuestion(questionId) {
    await attemptStore.goto(questionId)
    await loadCurrent()
  }

  async function gotoIndex(index) {
    const questionId = attemptStore.questionIds[index]
    if (questionId !== undefined) await gotoQuestion(questionId)
  }

  async function gotoPrevious() {
    if (currentIndex.value <= 0) return
    await gotoQuestion(attemptStore.questionIds[currentIndex.value - 1])
  }

  async function gotoNext() {
    if (currentIndex.value >= attemptStore.questionIds.length - 1) return
    await gotoQuestion(attemptStore.questionIds[currentIndex.value + 1])
  }

  function hasAnswerAtIndex(index) {
    const questionId = attemptStore.questionIds[index]
    return Boolean(attemptStore.answers[String(questionId)]?.answer)
  }

  async function handleFlag() {
    const reason = await promptDialog(t('questions.flagReason'), '')
    if (reason !== null) await attemptStore.flagCurrentQuestion(reason)
  }

  async function attemptFinish() {
    if (finishing.value) return
    finishing.value = true
    try {
      if (!attemptStore.isPreview) {
        const unanswered = attemptStore.totalQuestions - attemptStore.answeredCount
        if (unanswered > 0) {
          const ok = await confirm(t('masterExams.runnerUnansweredWarning', { count: unanswered }))
          if (!ok) return
        }
      }
      const result = await attemptStore.finish()
      if (result) navigateAfterFinish()
    } finally {
      finishing.value = false
    }
  }

  function navigateAfterFinish() {
    const suffix = attemptStore.isPreview ? 'edit' : 'result'
    router.push(`/master-exams/${examId.value}/${suffix}`)
  }

  watch(
    () => attemptStore.isComplete,
    (complete) => {
      if (complete) navigateAfterFinish()
    },
  )

  useAutoRefresh(
    async () => {
      if (attemptStore.isPreview || attemptStore.isComplete) return { skipped: true }
      return attemptStore.pollStatus()
    },
    30_000,
    false,
  )

  watch(graceMs, (milliseconds) => {
    if (
      milliseconds !== null &&
      milliseconds <= 0 &&
      !attemptStore.isComplete &&
      !attemptStore.isPreview
    ) {
      attemptFinish()
    }
  })

  onMounted(async () => {
    timerInterval = setInterval(() => {
      nowTick.value = Date.now()
    }, 1000)

    if (attemptStore.examId === examId.value && attemptStore.sessionId) {
      showPreStart.value = false
      await loadCurrent()
      return
    }

    attemptStore.reset()
    const exam = await masterExamStore.fetchOne(examId.value)
    if (exam) {
      attemptStore.hydrateFromExam(exam, { graceSeconds: 180 })
      if (!isPreview.value) await masterExamStore.acknowledge(examId.value)
    }
  })

  onBeforeUnmount(() => {
    if (timerInterval) clearInterval(timerInterval)
    if (preCountdownTimer) clearInterval(preCountdownTimer)
  })

  return {
    t,
    attemptStore,
    showPreStart,
    preCountdownActive,
    preCountdownValue,
    currentIndex,
    answerSubmitting,
    currentSavedAnswer,
    currentConfidence,
    timerDisplay,
    graceDisplay,
    timerClass,
    beginCountdown,
    cancelCountdown,
    exitAttempt,
    onSelectAnswer,
    onConfidenceChange,
    gotoIndex,
    gotoPrevious,
    gotoNext,
    hasAnswerAtIndex,
    handleFlag,
    attemptFinish,
  }
}

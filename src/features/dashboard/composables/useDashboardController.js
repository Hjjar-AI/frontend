import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useQuestionStore } from '@/stores/questionStore'
import { useBookmarkStore } from '@/stores/bookmarkStore'
import { useTestSessionStore } from '@/stores/testSessionStore'
import { useGroupStore } from '@/stores/groupStore'
import { useWrongAnswerStore } from '@/stores/wrongAnswerStore'
import { useAnalyticsStore } from '@/stores/analyticsStore'
import { useMasterExamStore } from '@/stores/masterExamStore'
import { useTipStore } from '@/stores/tipStore'
import { useStudyPlannerStore } from '@/stores/studyPlannerStore'
import { useDialog } from '@/composables/useDialog'
import { useNotify } from '@/composables/useNotify'
import { useRotatingContent } from '@/composables/useRotatingContent'
import { selectDashboardTips } from '@/utils/dashboardTips'

const TIP_ROTATE_MS = 10 * 60 * 1000

export function useDashboardController() {
  const { t, locale } = useI18n()
  const router = useRouter()
  const authStore = useAuthStore()
  const questionStore = useQuestionStore()
  const bookmarkStore = useBookmarkStore()
  const testSessionStore = useTestSessionStore()
  const groupStore = useGroupStore()
  const wrongAnswerStore = useWrongAnswerStore()
  const analyticsStore = useAnalyticsStore()
  const masterExamStore = useMasterExamStore()
  const tipStore = useTipStore()
  const studyPlannerStore = useStudyPlannerStore()
  const { confirm } = useDialog()
  const { notify } = useNotify()

  const bannerAnimated = ref(true)
  let stopTimer

  function stopBannerAnimation() {
    bannerAnimated.value = false
    if (stopTimer) clearTimeout(stopTimer)
  }

  function onVisibilityChange() {
    if (document.hidden) stopBannerAnimation()
  }

  const bookmarkedIds = computed(() => bookmarkStore.bookmarkedIds)
  const verifiedCount = computed(() => {
    const total = questionStore.pagination.total || 0
    const unverified = questionStore.unverifiedPagination.total || 0
    return Math.max(0, total - unverified)
  })
  const unverifiedCount = computed(() => questionStore.unverifiedPagination.total || 0)
  const bookmarkCount = computed(() => bookmarkStore.count)
  const weakCategories = computed(() => analyticsStore.summary?.weak_categories || [])

  const daysSinceLastLogin = computed(() => {
    if (!authStore.user?.last_login) return null
    const diff = Date.now() - new Date(authStore.user.last_login).getTime()
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
  })

  const resumableSession = computed(() => {
    if (
      !testSessionStore.sessionId ||
      !testSessionStore.mode ||
      testSessionStore.totalQuestions <= 0
    ) {
      return null
    }
    const mode = testSessionStore.mode
    const total = testSessionStore.totalQuestions
    const current = testSessionStore.currentIndex || 0
    const modePresentation = {
      exam: { label: 'tests.exam', icon: 'bi bi-journal-check' },
      study: { label: 'tests.study', icon: 'bi bi-book-half' },
      recall: { label: 'tests.recall', icon: 'bi bi-eye' },
    }[mode] || { label: 'tests.exam', icon: 'bi bi-journal-check' }
    return {
      mode,
      label: t(modePresentation.label),
      icon: modePresentation.icon,
      currentIndex: current,
      totalQuestions: total,
      progress: Math.round((current / total) * 100),
    }
  })

  const todayProgressPercent = computed(() => {
    if (!studyPlannerStore.planner) return resumableSession.value?.progress || 0
    const target = Number(studyPlannerStore.planner.target_questions_per_day) || 1
    return Math.min(100, Math.round((studyPlannerStore.todayProgress / target) * 100))
  })

  const todayProgressLabel = computed(() => {
    if (!studyPlannerStore.planner) {
      return resumableSession.value
        ? t('dashboard.sessionProgressLabel', { progress: resumableSession.value.progress })
        : t('dashboard.noDailyGoal')
    }
    return t('dashboard.todayProgressLabel', {
      current: studyPlannerStore.todayProgress,
      target: studyPlannerStore.planner.target_questions_per_day,
    })
  })

  const studyNowBreakdownLine = computed(() => {
    const breakdown = wrongAnswerStore.studyNowQueue?.breakdown
    if (!breakdown) return ''
    const parts = []
    if (breakdown.srs_due) parts.push(`${breakdown.srs_due} ${t('dashboard.breakdownSrs')}`)
    if (breakdown.planner_targets) {
      parts.push(`${breakdown.planner_targets} ${t('dashboard.breakdownPlanner')}`)
    }
    if (breakdown.fragile) parts.push(`${breakdown.fragile} ${t('dashboard.breakdownFragile')}`)
    if (breakdown.wrong_open) parts.push(`${breakdown.wrong_open} ${t('dashboard.breakdownWrong')}`)
    if (breakdown.weak_categories) {
      parts.push(`${breakdown.weak_categories} ${t('dashboard.breakdownWeak')}`)
    }
    if (breakdown.fresh) parts.push(`${breakdown.fresh} ${t('dashboard.breakdownFresh')}`)
    if (breakdown.general) parts.push(`${breakdown.general} ${t('dashboard.breakdownGeneral')}`)
    return parts.length ? t('dashboard.studyNowBreakdown', { parts: parts.join(' · ') }) : ''
  })

  const todayAction = computed(() => {
    if (resumableSession.value) {
      return {
        kind: 'resume',
        title: t('dashboard.continue'),
        description: t('dashboard.continueAt', {
          current: resumableSession.value.currentIndex + 1,
          total: resumableSession.value.totalQuestions,
        }),
        icon: 'bi bi-play-circle-fill',
        buttonIcon: 'bi bi-play-circle',
        buttonLabel: t('dashboard.resume'),
        loading: false,
      }
    }

    if (wrongAnswerStore.srsDueCount > 0) {
      return {
        kind: 'srs',
        title: t('dashboard.srsDue', { count: wrongAnswerStore.srsDueCount }),
        description: t('dashboard.srsDesc'),
        icon: 'bi bi-arrow-repeat',
        buttonIcon: 'bi bi-play-circle',
        buttonLabel: t('dashboard.srsStart'),
        loading: testSessionStore.isLoading,
      }
    }

    return {
      kind: 'study-now',
      title: t('dashboard.studyNow'),
      description: t('dashboard.studyNowDesc'),
      icon: 'bi bi-lightning-charge-fill',
      buttonIcon: 'bi bi-play-circle',
      buttonLabel: t('dashboard.startButton'),
      loading: wrongAnswerStore.isStudyNowLoading,
    }
  })

  const testModes = computed(() => [
    {
      mode: 'exam',
      path: '/exam',
      label: t('dashboard.testModeExam'),
      icon: 'bi bi-journal-check',
      desc: t('dashboard.testModeExamDesc'),
      color: 'var(--color-danger)',
    },
    {
      mode: 'study',
      path: '/study',
      label: t('dashboard.testModeStudy'),
      icon: 'bi bi-book-half',
      desc: t('dashboard.testModeStudyDesc'),
      color: 'var(--color-success)',
    },
  ])

  const tips = ref([...selectDashboardTips(locale.value)])
  const { current: currentTip, key: tipKey } = useRotatingContent({
    pool: tips,
    intervalMs: TIP_ROTATE_MS,
  })

  async function fetchTips() {
    const response = await tipStore.fetchForLocale(locale.value)
    const list = response ? tipStore.forLocale(locale.value) : []
    if (list.length) tips.value = [...list]
  }

  watch(locale, async (next) => {
    tips.value = [...selectDashboardTips(next)]
    await fetchTips()
  })

  async function startStudyNow() {
    const result = await wrongAnswerStore.fetchStudyNow(20)
    const ids = result?.question_ids || []
    if (ids.length === 0) {
      notify(t('dashboard.studyNowEmpty'), 'warning')
      return
    }
    const startResult = await testSessionStore.start('study', {
      question_ids: ids,
      tag: t('dashboard.studyNowTag'),
      limit: ids.length,
    })
    if (startResult) router.push('/study/question')
    else notify(t('dashboard.studyNowFailed'), 'error')
  }

  function runTodayAction() {
    if (todayAction.value.kind === 'resume') return resume(resumableSession.value.mode)
    if (todayAction.value.kind === 'srs') return startSRS()
    return startStudyNow()
  }

  function resume(mode) {
    router.push(`/${mode}`)
  }

  async function handleBookmark(id) {
    await bookmarkStore.toggle(id)
  }

  async function handleDelete(id) {
    if (!(await confirm(t('questions.deleteConfirm')))) return
    await questionStore.remove(id)
  }

  async function handleVerify(id) {
    await questionStore.toggleVerify(id)
  }

  async function startSRS() {
    const result = await testSessionStore.startSRS(20)
    if (result) router.push('/study/question')
  }

  async function startWeakAreasDrill() {
    const weak = weakCategories.value.slice(0, 3)
    if (weak.length === 0) {
      notify(t('dashboard.noWeakData'), 'warning')
      return
    }
    const result = await testSessionStore.start('study', {
      category_ids: [weak[0].category_id],
      verified_only: true,
      limit: 20,
      session_label: t('dashboard.weakCategoriesDrill'),
    })
    if (result) router.push('/study/question')
  }

  async function startMasterExam(exam) {
    const ok = await confirm(t('dashboard.masterExamStart', { name: exam.name }))
    if (ok) router.push(`/master-exams/${exam.id}/attempt`)
  }

  function handleMasterExamAction(exam, action) {
    if (action === 'start') startMasterExam(exam)
    else if (action === 'view-my-results') router.push(`/master-exams/${exam.id}/result`)
  }

  async function fetchData() {
    await Promise.all([
      questionStore.fetchList({ per_page: 10 }),
      questionStore.fetchUnverified({ per_page: 1 }),
      bookmarkStore.fetchBookmarks(),
      groupStore.fetchStreak(),
      wrongAnswerStore.fetchSummary(),
      analyticsStore.fetchSummary(30),
      masterExamStore.fetchNeedsAck(),
      groupStore.fetchHeatmap(365),
      studyPlannerStore.recordProgress().then(() => studyPlannerStore.fetchPlanner()),
    ])
  }

  onMounted(async () => {
    stopTimer = setTimeout(stopBannerAnimation, 16000)
    document.addEventListener('visibilitychange', onVisibilityChange)

    if (
      testSessionStore.sessionId &&
      testSessionStore.mode &&
      testSessionStore.totalQuestions === 0
    ) {
      testSessionStore.restoreFullState().catch(() => {})
    }

    await fetchTips()
    await fetchData()
  })

  onUnmounted(() => {
    if (stopTimer) clearTimeout(stopTimer)
    document.removeEventListener('visibilitychange', onVisibilityChange)
  })

  return {
    t,
    router,
    authStore,
    questionStore,
    bookmarkStore,
    testSessionStore,
    groupStore,
    wrongAnswerStore,
    masterExamStore,
    bannerAnimated,
    bookmarkedIds,
    verifiedCount,
    unverifiedCount,
    bookmarkCount,
    weakCategories,
    daysSinceLastLogin,
    resumableSession,
    todayAction,
    todayProgressPercent,
    todayProgressLabel,
    studyNowBreakdownLine,
    testModes,
    currentTip,
    tipKey,
    startStudyNow,
    runTodayAction,
    resume,
    handleBookmark,
    handleDelete,
    handleVerify,
    startSRS,
    startWeakAreasDrill,
    handleMasterExamAction,
    fetchData,
  }
}

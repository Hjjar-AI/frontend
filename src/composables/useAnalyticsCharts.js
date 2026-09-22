// frontend/src/composables/useAnalyticsCharts.js
//
// Chart-data transforms for the Analytics page.
//
// WHAT THIS REPLACES
// ------------------
// `Analytics.vue` used to build five Chart.js dataset objects inline
// as computeds: performance, category coverage, difficulty, tag
// coverage, and active users. Each one does its own sorting,
// top-N slicing, label mapping, and per-item color assignment —
// exactly the kind of work every sibling analytics widget does
// locally (see `CategoryMasteryCard.vue`, `DifficultyCalibrationCard.vue`,
// etc.). The page was breaking its own convention.
//
// Moving the five transforms here:
//   • restores consistency with the sibling-card pattern,
//   • lets each transform be unit-tested without mounting the page,
//   • and removes ~60 lines from the orchestrator view.
//
// INPUTS
// ------
// The composable receives two reactive sources:
//
//   • `store`   — the Pinia analytics store. Read for `summary` and
//                 `activeUsers`. Vue tracks the reads through
//                 Pinia's reactivity, so each computed re-runs when
//                 either field changes.
//   • `palette` — a Ref<string[]> from `useChartPalette()`. The
//                 palette ref changes when the theme changes, so
//                 every chart re-colors on theme switch without
//                 the page needing a watcher.
//
// The composable does not own the store or the palette — the caller
// passes them in. That keeps it testable: a test can pass a plain
// reactive object for `store` and a `ref([...])` for `palette`.
//
// LOCALE REACTIVITY
// -----------------
// `useI18n()` is called here (rather than reading from
// `i18n.global`) so the `t()` calls inside the computeds are
// reactive to locale changes. A user who switches language while
// the Analytics page is open sees the chart labels update without
// a re-mount.

import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

export function useAnalyticsCharts({ store, palette }) {
  const { t } = useI18n()

  // Short-name handle for the five palette slots. Recomputed on
  // every palette change (i.e. every theme switch).
  const C = computed(() => {
    const [primary, success, info, warning, danger] = palette.value
    return { primary, success, info, warning, danger }
  })

  const performanceChartData = computed(() => {
    const perf = store.summary?.user_performance || []
    return {
      labels: perf.map(p => p.date),
      datasets: [
        {
          label: t('analytics.seriesAccuracy'),
          data: perf.map(p => p.accuracy),
          borderColor: C.value.primary,
          tension: 0.3,
          fill: false,
        },
      ],
    }
  })

  const categoryCoverageChartData = computed(() => {
    const cats = store.summary?.category_coverage || []
    // Sort descending and cap at the top 10 — beyond that the bar
    // labels overlap and the chart becomes unreadable. The cap is
    // a visual choice, not a data-truncation: the remaining
    // categories are still in the store, they just do not appear
    // on this chart.
    const sorted = [...cats].sort((a, b) => b.total - a.total)
    const top = sorted.slice(0, 10)
    return {
      labels: top.map(c => c.category_name),
      datasets: [
        {
          label: t('analytics.seriesTotalQuestions'),
          data: top.map(c => c.total),
          // Prefer the category's own color when it has one; fall
          // back to the palette in order. The fallback index is the
          // item's position in `top`, not its position in the full
          // list, so two charts from the same page render
          // consistently.
          backgroundColor: top.map((c, i) =>
            c.color || palette.value[i % palette.value.length]
          ),
        },
      ],
    }
  })

  const difficultyChartData = computed(() => {
    const diff = store.summary?.difficulty_stats || []
    const labelMap = {
      easy: t('difficulty.easy'),
      medium: t('difficulty.medium'),
      hard: t('difficulty.hard'),
    }
    const byDifficulty = {
      easy: C.value.success,
      medium: C.value.warning,
      hard: C.value.danger,
    }
    return {
      labels: diff.map(d => labelMap[d.difficulty] || d.difficulty),
      datasets: [
        {
          label: t('analytics.seriesCorrectRate'),
          // `avg_correct_rate` is 0–1; the chart shows 0–100.
          data: diff.map(d => d.avg_correct_rate * 100),
          backgroundColor: diff.map(d => byDifficulty[d.difficulty] || C.value.primary),
        },
      ],
    }
  })

  const tagCoverageChartData = computed(() => {
    const tags = store.summary?.tag_coverage || []
    const sorted = [...tags].sort((a, b) => b.count - a.count)
    const top = sorted.slice(0, 10)
    return {
      labels: top.map(item => item.tag_name),
      datasets: [
        {
          label: t('analytics.seriesQuestionCount'),
          data: top.map(item => item.count),
          backgroundColor: C.value.info,
        },
      ],
    }
  })

  const activeUsersChartData = computed(() => {
    const users = store.activeUsers || []
    return {
      labels: users.map(u => u.date),
      datasets: [
        {
          label: t('analytics.seriesActiveUsers'),
          data: users.map(u => u.active_users),
          backgroundColor: C.value.primary,
        },
        {
          label: t('analytics.seriesNewUsers'),
          data: users.map(u => u.new_users),
          backgroundColor: C.value.success,
        },
      ],
    }
  })

  return {
    performanceChartData,
    categoryCoverageChartData,
    difficultyChartData,
    tagCoverageChartData,
    activeUsersChartData,
  }
}
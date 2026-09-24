<!-- frontend/src/features/analytics/views/Analytics.vue -->
<template>
  <Layout>
    <PageShell :title="t('analytics.title')" icon="bi bi-graph-up" page-class="analytics-page">
        <template #actions>
          <BaseDropdown
            :model-value="days"
            :options="dayOptions"
            :aria-label="t('analytics.daysLabel')"
            icon="bi bi-calendar3"
            @update:model-value="updateDays"
          />
          <BaseButton
            variant="secondary"
            size="small"
            @click="refresh"
            :loading="store.isLoading"
          >
            <i class="bi bi-arrow-repeat"></i>
          </BaseButton>
        </template>
      <FeedbackRegion :error="store.error" @dismiss="store.error = null" />

      <!-- ═══ Summary charts (existing) ═══════════════════════════ -->
      <div v-if="store.summary" class="analytics-grid">
        <ChartCard
          v-if="store.summary.user_performance?.length"
          :title="t('analytics.chartPerformance')"
          type="line"
          :data="performanceChartData"
          :options="chartOptions"
        />
        <ChartCard
          v-if="store.summary.category_coverage?.length"
          :title="t('analytics.chartCategoryCoverage')"
          type="bar"
          :data="categoryCoverageChartData"
          :options="chartOptions"
        />
        <ChartCard
          v-if="store.summary.difficulty_stats?.length"
          :title="t('analytics.chartDifficultyAccuracy')"
          type="bar"
          :data="difficultyChartData"
          :options="chartOptions"
        />
        <ChartCard
          v-if="store.summary.tag_coverage?.length"
          :title="t('analytics.chartTagCoverage')"
          type="bar"
          :data="tagCoverageChartData"
          :options="chartOptions"
        />
        <ChartCard
          v-if="canViewActiveUsers && store.activeUsers?.length"
          :title="t('analytics.chartActiveUsers')"
          type="bar"
          :data="activeUsersChartData"
          :options="chartOptions"
        />
      </div>
      <BaseEmptyState v-else :title="t('analytics.empty')" icon="bi-bar-chart" />

      <!-- ═══ Member-facing advanced (features 1, 3) ═══════════════ -->
      <section v-if="store.summary" class="analytics-section">
        <h2 class="analytics-section__header">
          <i class="bi bi-person-circle"></i>
          {{ t('analytics.sectionMember') }}
        </h2>

        <div class="analytics-member-grid">
          <BaseCard>
            <h3 class="card-title">
              <i class="card-title__icon bi bi-tags"></i>
              {{ t('analytics.categoryMasteryTitle') }}
            </h3>
            <p class="report-accordion__desc">
              {{ t('analytics.categoryMasteryDesc') }}
            </p>

            <AsyncContent
              :loading="store.isCategoryMasteryLoading"
              :error="store.categoryMasteryError"
              :skeleton-count="3"
              skeleton-height="32px"
              @retry="store.fetchCategoryMastery({ force: true })"
            >
              <CategoryMasteryCard :data="store.categoryMastery" />
            </AsyncContent>
          </BaseCard>

          <BaseCard>
            <h3 class="card-title">
              <i class="card-title__icon bi bi-calendar-check"></i>
              {{ t('analytics.streakHistoryTitle') }}
            </h3>
            <p class="report-accordion__desc">
              {{ t('analytics.streakHistoryDesc') }}
            </p>

            <AsyncContent
              :loading="store.isStreakHistoryLoading"
              :error="store.streakHistoryError"
              :skeleton-count="2"
              skeleton-height="48px"
              @retry="store.fetchStreakHistory({ force: true })"
            >
              <StreakHistoryCard :data="store.streakHistory" />
            </AsyncContent>
          </BaseCard>
        </div>
      </section>

      <!-- ═══ Admin advanced (features 4-8, lazy accordions) ══════ -->
      <section v-if="canViewAll" class="analytics-section">
        <h2 class="analytics-section__header">
          <i class="bi bi-people-fill"></i>
          {{ t('analytics.sectionAdmin') }}
        </h2>

        <!-- Feature 4: Difficulty calibration -->
        <ReportAccordion
          :title="t('analytics.difficultyCalibrationTitle')"
          icon="bi bi-speedometer2"
          :description="t('analytics.difficultyCalibrationDesc')"
          :expanded="open.difficulty"
          :loading="store.isDifficultyCalibrationLoading"
          :error="store.difficultyCalibrationError || ''"
          :summary="difficultySummary"
          @toggle="toggle('difficulty')"
          @retry="store.fetchDifficultyCalibration({ force: true })"
        >
          <DifficultyCalibrationCard :data="store.difficultyCalibration" />
        </ReportAccordion>

        <!-- Feature 5: Author flag rate -->
        <ReportAccordion
          :title="t('analytics.authorFlagRateTitle')"
          icon="bi bi-flag"
          :description="t('analytics.authorFlagRateDesc')"
          :expanded="open.authorFlags"
          :loading="store.isAuthorFlagRateLoading"
          :error="store.authorFlagRateError || ''"
          :summary="authorFlagSummary"
          @toggle="toggle('authorFlags')"
          @retry="store.fetchAuthorFlagRate({ force: true })"
        >
          <AuthorFlagRateCard :data="store.authorFlagRate" />
        </ReportAccordion>

        <!-- Feature 6: Exam duration -->
        <ReportAccordion
          :title="t('analytics.examDurationTitle')"
          icon="bi bi-stopwatch"
          :description="t('analytics.examDurationDesc')"
          :expanded="open.examDuration"
          :loading="store.isExamDurationLoading"
          :error="store.examDurationError || ''"
          :summary="examDurationSummary"
          @toggle="toggle('examDuration')"
          @retry="store.fetchExamDuration({ force: true })"
        >
          <ExamDurationCard :data="store.examDuration" />
        </ReportAccordion>

        <!-- Feature 7: Cohort comparison -->
        <ReportAccordion
          :title="t('analytics.cohortComparisonTitle')"
          icon="bi bi-people"
          :description="t('analytics.cohortComparisonDesc')"
          :expanded="open.cohortComparison"
          :loading="store.isCohortComparisonLoading"
          :error="store.cohortComparisonError || ''"
          :summary="cohortSummary"
          @toggle="toggle('cohortComparison')"
          @retry="store.fetchCohortComparison({ force: true })"
        >
          <CohortComparisonCard :data="store.cohortComparison" />
        </ReportAccordion>

        <!-- Feature 8: Weekly retention -->
        <ReportAccordion
          :title="t('analytics.weeklyRetentionTitle')"
          icon="bi bi-graph-up-arrow"
          :description="t('analytics.weeklyRetentionDesc')"
          :expanded="open.retention"
          :loading="store.isWeeklyRetentionLoading"
          :error="store.weeklyRetentionError || ''"
          :summary="retentionSummary"
          @toggle="toggle('retention')"
          @retry="store.fetchWeeklyRetention({ force: true })"
        >
          <WeeklyRetentionCard :data="store.weeklyRetention" />
        </ReportAccordion>
      </section>
    </PageShell>
  </Layout>
</template>

<script setup>
import '@/assets/analytics.css'
import { ref, computed, reactive, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useAnalyticsStore } from '@/stores/analyticsStore'
import { useAuthStore } from '@/stores/authStore'
import { useChartPalette } from '@/composables/useChartPalette'
import { useAnalyticsCharts } from '@/composables/useAnalyticsCharts'

import Layout from '@/components/common/Layout.vue'
import PageShell from '@/components/common/PageShell.vue'
import ChartCard from '@/components/charts/ChartCard.vue'
import BaseEmptyState from '@/components/base/BaseEmptyState.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseDropdown from '@/components/base/BaseDropdown.vue'
import AsyncContent from '@/components/common/AsyncContent.vue'
import FeedbackRegion from '@/components/common/FeedbackRegion.vue'

import ReportAccordion from '../components/ReportAccordion.vue'
import CategoryMasteryCard from '../components/CategoryMasteryCard.vue'
import StreakHistoryCard from '../components/StreakHistoryCard.vue'
import DifficultyCalibrationCard from '../components/DifficultyCalibrationCard.vue'
import AuthorFlagRateCard from '../components/AuthorFlagRateCard.vue'
import ExamDurationCard from '../components/ExamDurationCard.vue'
import CohortComparisonCard from '../components/CohortComparisonCard.vue'
import WeeklyRetentionCard from '../components/WeeklyRetentionCard.vue'

const { t } = useI18n()

const store = useAnalyticsStore()
const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

const canViewActiveUsers = computed(() => authStore.can('admin.active_users'))
const canViewAll = computed(() => authStore.can('analytics.view_all'))

const { palette } = useChartPalette()
const {
  performanceChartData,
  categoryCoverageChartData,
  difficultyChartData,
  tagCoverageChartData,
  activeUsersChartData,
} = useAnalyticsCharts({ store, palette })

const allowedDays = new Set([7, 30, 90])
const initialDays = Number(route.query.days)
const days = ref(allowedDays.has(initialDays) ? initialDays : 30)

const dayOptions = computed(() => [
  { value: 7,  label: t('analytics.days7') },
  { value: 30, label: t('analytics.days30') },
  { value: 90, label: t('analytics.days90') },
])

const chartOptions = {
  plugins: { legend: { display: true } },
  scales: { y: { beginAtZero: true } },
}

// ── Accordion state (admin reports only) ──────────────────────────
const open = reactive({
  difficulty: false,
  authorFlags: false,
  examDuration: false,
  cohortComparison: false,
  retention: false,
})

const REPORT_LOADERS = {
  difficulty: () => store.fetchDifficultyCalibration(),
  authorFlags: () => store.fetchAuthorFlagRate(),
  examDuration: () => store.fetchExamDuration(),
  cohortComparison: () => store.fetchCohortComparison(),
  retention: () => store.fetchWeeklyRetention(),
}

function toggle(key) {
  open[key] = !open[key]
  if (open[key]) {
    const loader = REPORT_LOADERS[key]
    if (loader) loader()
  }
}

// ── Summary chip text (right side of each accordion header) ───────
const difficultySummary = computed(() => {
  const rows = store.difficultyCalibration?.rows
  if (!rows || !rows.length) return ''
  const total = rows.reduce((s, r) => s + r.question_count, 0)
  return `${total} ${t('analytics.difficultyCalibrationQuestions')}`
})

const authorFlagSummary = computed(() => {
  const rows = store.authorFlagRate?.rows
  if (!rows || !rows.length) return ''
  return `${rows.length} ${t('analytics.authorFlagRateAuthor')}`
})

const examDurationSummary = computed(() => {
  const d = store.examDuration
  if (!d) return ''
  return `${d.total_sessions || 0} ${t('analytics.examDurationTotal')}`
})

const cohortSummary = computed(() => {
  const rows = store.cohortComparison?.rows
  if (!rows || !rows.length) return ''
  return `${rows.length} ${t('analytics.cohortComparisonGroup')}`
})

const retentionSummary = computed(() => {
  const rows = store.weeklyRetention?.rows
  if (!rows || !rows.length) return ''
  return `${rows[0].retention_rate.toFixed(0)}%`
})

// ── Fetch orchestration ───────────────────────────────────────────
async function refresh() {
  await store.fetchSummary(days.value)
  if (canViewActiveUsers.value) {
    await store.fetchActiveUsers(days.value)
  }
  await Promise.all([
    store.fetchCategoryMastery(),
    store.fetchStreakHistory(),
  ])
}

function updateDays(val) {
  days.value = Number(val)
  refresh()
}

watch(days, (value) => {
  router.replace({ query: { ...route.query, days: value === 30 ? undefined : String(value) } })
})

watch(() => route.query.days, (value) => {
  const next = Number(value || 30)
  if (!allowedDays.has(next) || next === days.value) return
  days.value = next
  refresh()
})

onMounted(refresh)
</script>

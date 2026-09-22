<!-- frontend/src/features/analytics/components/StreakHistoryCard.vue -->
<!--
  Feature 3 — day-by-day study activity.

  Receives the raw response from `GET /api/v1/analytics/streak-history/`:
      { days: [{date, sessions, questions}],
        current_streak, longest_streak, active_days,
        total_sessions, total_questions }

  Renders a stat strip, then a compact bar chart — one bar per day.
  The bar height is the day's session count as a percentage of the
  highest day in the window. Empty days render as a flat 2-pixel bar
  so the row keeps its baseline even through long gaps.
-->
<template>
  <div>
    <div v-if="!days.length" class="report-empty">
      <i class="bi bi-calendar-x"></i>
      {{ t('analytics.streakHistoryNoData') }}
    </div>

    <template v-else>
      <div class="report-stats">
        <div class="report-stat">
          <span class="report-stat__value">{{ currentStreak }}</span>
          <span class="report-stat__label">
            {{ t('analytics.streakHistoryCurrentStreak') }}
          </span>
        </div>
        <div class="report-stat">
          <span class="report-stat__value">{{ longestStreak }}</span>
          <span class="report-stat__label">
            {{ t('analytics.streakHistoryLongestStreak') }}
          </span>
        </div>
        <div class="report-stat">
          <span class="report-stat__value">{{ activeDays }}</span>
          <span class="report-stat__label">
            {{ t('analytics.streakHistoryActiveDays') }}
          </span>
        </div>
        <div class="report-stat">
          <span class="report-stat__value">{{ totalSessions }}</span>
          <span class="report-stat__label">
            {{ t('analytics.streakHistorySessions') }}
          </span>
        </div>
      </div>

      <div class="streak-chart">
        <div
          v-for="day in days"
          :key="day.date"
          class="streak-chart__day"
          :class="{ 'streak-chart__day--empty': day.sessions === 0 }"
          :style="barStyle(day)"
          :title="dayTitle(day)"
        ></div>
      </div>
      <div class="streak-chart__baseline">
        <span>{{ days[0]?.date }}</span>
        <span>{{ days[days.length - 1]?.date }}</span>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const { t } = useI18n()

const props = defineProps({
  data: { type: Object, default: null },
})

const days = computed(() => props.data?.days || [])
const currentStreak = computed(() => props.data?.current_streak || 0)
const longestStreak = computed(() => props.data?.longest_streak || 0)
const activeDays = computed(() => props.data?.active_days || 0)
const totalSessions = computed(() => props.data?.total_sessions || 0)

const maxSessions = computed(() => {
  if (!days.value.length) return 1
  return Math.max(1, ...days.value.map(d => d.sessions))
})

function barStyle(day) {
  if (day.sessions === 0) return { height: '2px' }
  const pct = (day.sessions / maxSessions.value) * 100
  return { height: Math.max(4, pct) + '%' }
}

function dayTitle(day) {
  return `${day.date}: ${day.sessions} ${t('analytics.streakHistorySessions')}, ` +
         `${day.questions} ${t('analytics.streakHistoryQuestions')}`
}
</script>
<!-- frontend/src/features/analytics/components/ExamDurationCard.vue -->
<!--
  Feature 6 — session duration histogram.

  Receives `{ buckets: [...], total_sessions, avg_seconds }` from
  `GET /api/v1/analytics/admin/exam-duration/`. The backend always
  returns exactly five buckets so the bar heights are directly
  comparable across page loads.
-->
<template>
  <div>
    <div v-if="!buckets.length || totalSessions === 0" class="report-empty">
      <i class="bi bi-stopwatch"></i>
      {{ t('analytics.examDurationEmpty') }}
    </div>

    <template v-else>
      <div class="report-stats">
        <div class="report-stat">
          <span class="report-stat__value">{{ totalSessions }}</span>
          <span class="report-stat__label">{{ t('analytics.examDurationTotal') }}</span>
        </div>
        <div class="report-stat">
          <span class="report-stat__value">{{ formattedAvg }}</span>
          <span class="report-stat__label">{{ t('analytics.examDurationAvg') }}</span>
        </div>
      </div>

      <div class="report-bars">
        <div
          v-for="bucket in buckets"
          :key="bucket.bucket"
          class="report-bar"
        >
          <span class="report-bar__label">
            <span class="report-bar__label-text">{{ bucket.label }}</span>
          </span>
          <div class="report-bar__track">
            <div
              class="report-bar__fill"
              :style="{
                width: bucket.percentage + '%',
                background: 'var(--color-primary)',
              }"
            ></div>
          </div>
          <span class="report-bar__value">
            {{ bucket.count }}
            <small class="text-muted">({{ bucket.percentage.toFixed(0) }}%)</small>
          </span>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { formatTime } from '@/utils/timer'

const { t } = useI18n()

const props = defineProps({
  data: { type: Object, default: null },
})

const buckets = computed(() => props.data?.buckets || [])
const totalSessions = computed(() => props.data?.total_sessions || 0)

const formattedAvg = computed(() => {
  const s = props.data?.avg_seconds || 0
  return formatTime(Math.round(s))
})
</script>
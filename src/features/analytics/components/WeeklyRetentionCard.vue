<!-- frontend/src/features/analytics/components/WeeklyRetentionCard.vue -->
<!--
  Feature 8 — week-over-week retention.

  Receives `{ rows: [...] }` from
  `GET /api/v1/analytics/admin/retention/`. Rows are returned newest
  first; the first row's rate is what the accordion header shows as
  its summary chip.
-->
<template>
  <div>
    <div v-if="!rows.length" class="report-empty">
      <i class="bi bi-graph-up-arrow"></i>
      {{ t('analytics.weeklyRetentionEmpty') }}
    </div>

    <BaseTableShell v-else density="compact" striped>
      <table class="table-shared report-table">
        <thead>
          <tr>
            <th>{{ t('analytics.weeklyRetentionWeek') }}</th>
            <th class="numeric">{{ t('analytics.weeklyRetentionPriorActive') }}</th>
            <th class="numeric">{{ t('analytics.weeklyRetentionThisActive') }}</th>
            <th class="numeric">{{ t('analytics.weeklyRetentionRetained') }}</th>
            <th class="numeric">{{ t('analytics.weeklyRetentionRate') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.week_start">
            <td>{{ row.week_start }}</td>
            <td class="numeric">{{ row.active_prior_week }}</td>
            <td class="numeric">{{ row.active_this_week }}</td>
            <td class="numeric">{{ row.retained }}</td>
            <td class="numeric">
              <span :class="retentionChipClass(row.retention_rate)">
                {{ row.retention_rate.toFixed(1) }}%
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </BaseTableShell>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import BaseTableShell from '@/components/common/BaseTableShell.vue'

const { t } = useI18n()

const props = defineProps({
  data: { type: Object, default: null },
})

const rows = computed(() => props.data?.rows || [])

function retentionChipClass(rate) {
  // Retention thresholds are intentionally different from the
  // accuracy thresholds above: a "great" retention for a study app
  // is around 60% week-over-week; anything over 30% is healthy.
  if (rate >= 60) return 'accuracy-chip accuracy-chip--great'
  if (rate >= 30) return 'accuracy-chip accuracy-chip--ok'
  return 'accuracy-chip accuracy-chip--low'
}
</script>

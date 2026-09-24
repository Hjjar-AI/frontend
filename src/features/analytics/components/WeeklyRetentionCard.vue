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

    <BaseTableShell v-else density="compact" striped mobile-mode="cards">
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
            <td :data-label="t('analytics.weeklyRetentionWeek')">{{ row.week_start }}</td>
            <td class="numeric" :data-label="t('analytics.weeklyRetentionPriorActive')">{{ row.active_prior_week }}</td>
            <td class="numeric" :data-label="t('analytics.weeklyRetentionThisActive')">{{ row.active_this_week }}</td>
            <td class="numeric" :data-label="t('analytics.weeklyRetentionRetained')">{{ row.retained }}</td>
            <td class="numeric" :data-label="t('analytics.weeklyRetentionRate')">
              <BaseBadge :variant="retentionVariant(row.retention_rate)">
                {{ row.retention_rate.toFixed(1) }}%
              </BaseBadge>
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
import BaseBadge from '@/components/base/BaseBadge.vue'

const { t } = useI18n()

const props = defineProps({
  data: { type: Object, default: null },
})

const rows = computed(() => props.data?.rows || [])

function retentionVariant(rate) {
  // Retention thresholds are intentionally different from the
  // accuracy thresholds above: a "great" retention for a study app
  // is around 60% week-over-week; anything over 30% is healthy.
  if (rate >= 60) return 'success'
  if (rate >= 30) return 'warning'
  return 'danger'
}
</script>

<!-- frontend/src/features/analytics/components/CohortComparisonCard.vue -->
<!--
  Feature 7 — per-group aggregate comparison.

  Receives `{ rows: [...] }` from
  `GET /api/v1/analytics/admin/cohort-comparison/`. Groups with no
  activity in the window are omitted by the backend, so an empty
  response is a legitimate "nobody studied" state, not an error.
-->
<template>
  <div>
    <div v-if="!rows.length" class="report-empty">
      <i class="bi bi-people"></i>
      {{ t('analytics.cohortComparisonEmpty') }}
    </div>

    <BaseTableShell v-else density="compact" striped mobile-mode="cards">
      <table class="table-shared report-table">
        <thead>
          <tr>
            <th>{{ t('analytics.cohortComparisonGroup') }}</th>
            <th class="numeric">{{ t('analytics.cohortComparisonMembers') }}</th>
            <th class="numeric">{{ t('analytics.cohortComparisonActive') }}</th>
            <th class="numeric">{{ t('analytics.cohortComparisonSessions') }}</th>
            <th class="numeric">{{ t('analytics.cohortComparisonQuestions') }}</th>
            <th class="numeric">{{ t('analytics.cohortComparisonAccuracy') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.group_id">
            <td :data-label="t('analytics.cohortComparisonGroup')">{{ row.group_name }}</td>
            <td class="numeric" :data-label="t('analytics.cohortComparisonMembers')">{{ row.member_count }}</td>
            <td class="numeric" :data-label="t('analytics.cohortComparisonActive')">{{ row.active_users }}</td>
            <td class="numeric" :data-label="t('analytics.cohortComparisonSessions')">{{ row.session_count }}</td>
            <td class="numeric" :data-label="t('analytics.cohortComparisonQuestions')">{{ row.total_questions }}</td>
            <td class="numeric" :data-label="t('analytics.cohortComparisonAccuracy')">
              <BaseBadge :variant="accuracyVariant(row.avg_accuracy)">
                {{ row.avg_accuracy.toFixed(1) }}%
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

function accuracyVariant(acc) {
  if (acc >= 80) return 'success'
  if (acc >= 50) return 'warning'
  return 'danger'
}
</script>

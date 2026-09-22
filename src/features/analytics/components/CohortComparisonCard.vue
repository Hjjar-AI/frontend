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

    <div v-else class="report-table-wrap">
      <table class="report-table">
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
            <td>{{ row.group_name }}</td>
            <td class="numeric">{{ row.member_count }}</td>
            <td class="numeric">{{ row.active_users }}</td>
            <td class="numeric">{{ row.session_count }}</td>
            <td class="numeric">{{ row.total_questions }}</td>
            <td class="numeric">
              <span :class="accuracyChipClass(row.avg_accuracy)">
                {{ row.avg_accuracy.toFixed(1) }}%
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const { t } = useI18n()

const props = defineProps({
  data: { type: Object, default: null },
})

const rows = computed(() => props.data?.rows || [])

function accuracyChipClass(acc) {
  if (acc >= 80) return 'accuracy-chip accuracy-chip--great'
  if (acc >= 50) return 'accuracy-chip accuracy-chip--ok'
  return 'accuracy-chip accuracy-chip--low'
}
</script>
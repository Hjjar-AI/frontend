<!-- frontend/src/features/analytics/components/AuthorFlagRateCard.vue -->
<!--
  Feature 5 — flagged-question rate per author.

  Receives `{ rows: [...] }` from
  `GET /api/v1/analytics/admin/author-flag-rate/`. The backend hides
  authors with zero flags, so an empty list here means "no flags
  anywhere" — which the card renders as a positive empty state.
-->
<template>
  <div>
    <div v-if="!rows.length" class="report-empty">
      <i class="bi bi-shield-check text-success"></i>
      {{ t('analytics.authorFlagRateEmpty') }}
    </div>

    <BaseTableShell v-else density="compact" striped mobile-mode="cards">
      <table class="table-shared report-table">
        <thead>
          <tr>
            <th>{{ t('analytics.authorFlagRateAuthor') }}</th>
            <th class="numeric">{{ t('analytics.authorFlagRateTotal') }}</th>
            <th class="numeric">{{ t('analytics.authorFlagRateFlagged') }}</th>
            <th class="numeric">{{ t('analytics.authorFlagRateRate') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.author">
            <td :data-label="t('analytics.authorFlagRateAuthor')">{{ row.author }}</td>
            <td class="numeric" :data-label="t('analytics.authorFlagRateTotal')">{{ row.total_questions }}</td>
            <td class="numeric" :data-label="t('analytics.authorFlagRateFlagged')">{{ row.flagged_questions }}</td>
            <td class="numeric" :data-label="t('analytics.authorFlagRateRate')">
              <BaseBadge :variant="rateVariant(row.flag_rate)">
                {{ row.flag_rate.toFixed(1) }}%
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

function rateVariant(rate) {
  // Thresholds are arbitrary but map to the three accuracy-chip
  // variants the rest of the analytics page uses, so the whole page
  // reads with the same colour language.
  if (rate >= 25) return 'danger'
  if (rate >= 10) return 'warning'
  return 'success'
}
</script>

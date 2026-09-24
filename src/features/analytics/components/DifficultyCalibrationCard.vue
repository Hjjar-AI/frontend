<!-- frontend/src/features/analytics/components/DifficultyCalibrationCard.vue -->
<!--
  Feature 4 — designed difficulty vs observed accuracy.

  Receives `{ rows: [...] }` from
  `GET /api/v1/analytics/admin/difficulty-calibration/`. The backend
  always returns exactly three rows (easy, medium, hard) in that
  order, so the bar chart's visual ordering is fixed regardless of
  the data.

  Renders the same data twice: once as bars (for at-a-glance
  calibration reading) and once as a table (for the exact counts).

  DIFFICULTY DISPLAY METADATA
  ---------------------------
  Labels and colours come from the shared `DIFFICULTY_OPTIONS`
  registry in `utils/constants.js`. This component previously carried
  its own private `difficultyLabel` / `difficultyColor` maps that
  duplicated the values held by `MasterExamEditor`, `MasterExamDrafts`,
  and `DifficultySelector`. A change to the label key or the accent
  colour had to be replicated by hand in four places.
-->
<template>
  <div>
    <div v-if="!rows.length" class="report-empty">
      <i class="bi bi-speedometer"></i>
      {{ t('analytics.difficultyCalibrationEmpty') }}
    </div>

    <template v-else>
      <div class="report-bars">
        <div v-for="row in rows" :key="row.difficulty" class="report-bar">
          <span class="report-bar__label">
            <span
              class="report-bar__label-dot"
              :style="{ background: difficultyColor(row.difficulty) }"
            ></span>
            <span class="report-bar__label-text">
              {{ difficultyLabel(row.difficulty) }}
            </span>
          </span>
          <div class="report-bar__track">
            <div
              class="report-bar__fill"
              :style="{
                width: row.observed_accuracy + '%',
                background: difficultyColor(row.difficulty),
              }"
            ></div>
          </div>
          <span class="report-bar__value">
            {{ row.observed_accuracy.toFixed(1) }}%
          </span>
        </div>
      </div>

      <BaseTableShell class="difficulty-calibration__table" density="compact" striped>
        <table class="table-shared report-table">
          <thead>
            <tr>
              <th>{{ t('difficulty.label') }}</th>
              <th class="numeric">
                {{ t('analytics.difficultyCalibrationQuestions') }}
              </th>
              <th class="numeric">
                {{ t('analytics.difficultyCalibrationAnswered') }}
              </th>
              <th class="numeric">
                {{ t('analytics.difficultyCalibrationObserved') }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.difficulty">
              <td>{{ difficultyLabel(row.difficulty) }}</td>
              <td class="numeric">{{ row.question_count }}</td>
              <td class="numeric">{{ row.total_answered }}</td>
              <td class="numeric">{{ row.observed_accuracy.toFixed(1) }}%</td>
            </tr>
          </tbody>
        </table>
      </BaseTableShell>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import BaseTableShell from '@/components/common/BaseTableShell.vue'
import {
  difficultyLabelFor,
  difficultyColorFor,
} from '@/utils/constants'

const { t } = useI18n()

const props = defineProps({
  data: { type: Object, default: null },
})

const rows = computed(() => props.data?.rows || [])

// Both helpers fall through to a safe value when the difficulty is
// not one of the three registry entries:
//   • difficultyLabelFor returns the raw value (a visible label)
//   • difficultyColorFor returns the primary token (a visible bar)
// The previous local implementations did the same thing, so behaviour
// is unchanged — the maps simply moved to one shared location.
function difficultyLabel(d) {
  return difficultyLabelFor(d, t)
}

function difficultyColor(d) {
  return difficultyColorFor(d)
}
</script>

<!-- frontend/src/features/analytics/components/ReportAccordion.vue -->
<!--
  Collapsible wrapper for one analytics report.

  Renders a header that acts as a toggle button, then a body that is
  hidden until the user expands it. The parent owns the `expanded`
  state and emits a `toggle` event; the parent also owns when to call
  the fetch action. The accordion itself does not fetch anything — it
  only renders `loading`, `error`, or its default slot.

  Usage:
    <ReportAccordion
      title="…"
      icon="bi bi-bar-chart"
      :expanded="open.difficulty"
      :loading="store.isDifficultyCalibrationLoading"
      :error="store.difficultyCalibrationError || ''"
      @toggle="toggleReport('difficulty')"
      @retry="store.fetchDifficultyCalibration({ force: true })"
    >
      <DifficultyCalibrationCard :rows="store.difficultyCalibration?.rows || []" />
    </ReportAccordion>

  The header shows a title, an icon, and a rotating chevron. When the
  body is loading, a skeleton is shown in place of the slot. When the
  body has an error, an ErrorBanner with a retry button is shown.
-->
<template>
  <BaseCard class="report-accordion">
    <button
      type="button"
      class="report-accordion__toggle"
      :aria-expanded="expanded"
      :aria-controls="bodyId"
      @click="$emit('toggle')"
    >
      <span class="report-accordion__toggle-left">
        <i :class="icon"></i>
        <span class="report-accordion__title">{{ title }}</span>
        <i
          class="bi bi-chevron-down report-accordion__arrow"
          :class="{ 'report-accordion__arrow--open': expanded }"
          aria-hidden="true"
        ></i>
      </span>
      <span v-if="summary" class="report-accordion__summary">{{ summary }}</span>
    </button>

    <div v-show="expanded" :id="bodyId" class="report-accordion__body">
      <p v-if="description" class="report-accordion__desc">{{ description }}</p>

      <div v-if="loading" class="report-accordion__skeleton">
        <BaseSkeleton :count="3" height="48px" stacked />
      </div>

      <ErrorBanner v-else-if="error" :error="error" retry @retry="$emit('retry')" />

      <slot v-else />
    </div>
  </BaseCard>
</template>

<script setup>
import { useId } from 'vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseSkeleton from '@/components/base/BaseSkeleton.vue'
import ErrorBanner from '@/components/common/ErrorBanner.vue'

const props = defineProps({
  title: { type: String, required: true },
  icon: { type: String, default: 'bi bi-bar-chart' },
  // Short summary line shown on the right of the header while
  // collapsed — e.g. "12 categories", "8 groups". Optional.
  summary: { type: String, default: '' },
  // Longer text shown at the top of the body explaining what the
  // report shows. Optional.
  description: { type: String, default: '' },
  expanded: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

defineEmits(['toggle', 'retry'])

// Vue's public ID API avoids coupling this presentation component to
// internal component-instance details while keeping aria-controls stable.
const bodyId = `report-accordion-body-${useId()}`
</script>

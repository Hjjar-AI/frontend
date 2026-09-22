<!-- frontend/src/features/masterExams/components/ResultStatGrid.vue -->
<!--
  Shared stat-tile grid for the two master-exam result views.

  Both `MasterExamResults.vue` and `MasterExamMyResult.vue` render the
  same `.master-exam-results__stat-grid` markup with the same
  `.master-exam-results__stat-tile` / `__stat-value` / `__stat-label`
  classes. Only the values and their accent colours differ.

  The caller passes a list of `{ value, label, accent, key }`. The
  accent is a CSS colour token (`var(--color-success)` etc.); the key
  is a stable identity for v-for.

  WHY NOT `StatTile.vue`
  ----------------------
  `StatTile.vue` is the shared base component, but its value goes
  through `useCountUp` for a numeric animation. The master-exam result
  values include a percent-formatted string (`"75.3%"`) that would
  pass through the animated path incorrectly on older versions of
  StatTile. This component renders the value verbatim — no
  interpolation, no formatting assumption — which is exactly what the
  two views were doing inline.
-->
<template>
  <div class="master-exam-results__stat-grid">
    <div
      v-for="item in items"
      :key="item.key"
      class="master-exam-results__stat-tile"
      :style="{ '--stat-accent': item.accent }"
    >
      <span class="master-exam-results__stat-value">{{ item.value }}</span>
      <span class="master-exam-results__stat-label">{{ item.label }}</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  items: {
    type: Array,
    required: true,
    // Each entry: { key, value, label, accent }
  },
})
</script>

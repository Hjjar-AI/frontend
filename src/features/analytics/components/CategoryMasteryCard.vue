<!-- frontend/src/features/analytics/components/CategoryMasteryCard.vue -->
<!--
  Feature 1 — the caller's current mastery per category.

  Receives the raw response from `GET /api/v1/analytics/category-mastery/`:
      { categories: [...], total_categories: number }

  Renders a stat strip and a ranked list of categories. Each bar's
  fill width is the accuracy percentage; the fill colour is the
  category's own colour so the visual matches the badge on the
  question cards. A green check marks categories above the "mastered"
  threshold (80%, matching the results page score class).
-->
<template>
  <div>
    <div v-if="!categories.length" class="report-empty">
      <i class="bi bi-journal-x"></i>
      {{ t('analytics.categoryMasteryEmpty') }}
    </div>

    <template v-else>
      <div class="report-stats">
        <div class="report-stat">
          <span class="report-stat__value">{{ totalCategories }}</span>
          <span class="report-stat__label">{{ t('analytics.categoryMasteryTotal') }}</span>
        </div>
        <div class="report-stat">
          <span class="report-stat__value">{{ masteredCount }}</span>
          <span class="report-stat__label">{{ t('analytics.categoryMasteryMastered') }}</span>
        </div>
        <div class="report-stat">
          <span class="report-stat__value">{{ avgMastery.toFixed(1) }}%</span>
          <span class="report-stat__label">{{ t('analytics.categoryMasteryScore') }}</span>
        </div>
      </div>

      <div class="report-bars">
        <div
          v-for="cat in categories"
          :key="cat.category_id"
          class="report-bar"
        >
          <span class="report-bar__label">
            <span
              class="report-bar__label-dot"
              :style="{ background: cat.category_color }"
            ></span>
            <span class="report-bar__label-text" :title="cat.category_name">
              {{ cat.category_name }}
            </span>
            <i
              v-if="cat.mastered"
              class="bi bi-patch-check-fill text-success"
              :title="t('analytics.categoryMasteryMastered')"
            ></i>
          </span>
          <div class="report-bar__track">
            <div
              class="report-bar__fill"
              :style="{
                width: scoreFor(cat) + '%',
                background: cat.category_color,
              }"
            ></div>
          </div>
          <span class="report-bar__value">
            {{ scoreFor(cat).toFixed(1) }}%
            <small class="text-muted">({{ cat.attempts }})</small>
          </span>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const { t } = useI18n()

const props = defineProps({
  // Response shape from the category-mastery endpoint; null while
  // the initial fetch is in flight.
  data: { type: Object, default: null },
})

const categories = computed(() => props.data?.categories || [])
const totalCategories = computed(() => props.data?.total_categories || 0)

const masteredCount = computed(
  () => categories.value.filter(c => c.mastered).length
)

const scoreFor = (category) => category.mastery_score ?? category.accuracy ?? 0

const avgMastery = computed(() => {
  if (!categories.value.length) return 0
  const sum = categories.value.reduce((sum, category) => sum + scoreFor(category), 0)
  return sum / categories.value.length
})
</script>

<!-- frontend/src/features/planner/views/StudyPlanner.vue -->
<template>
  <Layout>
    <PageShell
      :title="t('planner.title')"
      icon="bi bi-calendar-check"
      page-class="planner-page"
    >
      <ErrorBanner :error="store.error" @dismiss="store.error = null" />

      <BaseCard v-if="store.planner" class="planner-card">
        <div class="planner-summary">
          <div class="planner-progress">
            <h4>{{ t('planner.todayProgress') }}</h4>
            <div class="progress-circle">
              <svg viewBox="0 0 36 36" class="progress-ring">
                <path class="progress-ring__bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path class="progress-ring__circle" :stroke-dasharray="`${progressPercent}, 100`" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
              <span class="progress-text">{{ store.todayProgress }} / {{ store.planner.target_questions_per_day }}</span>
            </div>
            <span v-if="store.targetReached" class="badge badge-success">{{ t('planner.targetReached') }}</span>
          </div>

          <div class="planner-settings">
            <h4>{{ t('planner.settingsTitle') }}</h4>
            <FormGrid>
              <BaseInput v-model.number="editForm.target" :label="t('planner.targetDaily')" type="number" min="1" />
              <BaseSelect v-model="editForm.categories" :label="t('planner.targetCategories')" :options="categoryOptions" multiple />
              <BaseInput v-model="editForm.tags" :label="t('planner.targetTags')" :placeholder="t('planner.targetTagsPlaceholder')" />
              <BaseInput v-model="editForm.startDate" :label="t('planner.startDate')" type="date" />
              <BaseInput v-model="editForm.endDate" :label="t('planner.endDate')" type="date" />
            </FormGrid>
            <div class="form-actions">
              <BaseButton variant="primary" :loading="store.isLoading" @click="savePlan">{{ t('planner.save') }}</BaseButton>
              <BaseButton variant="danger" :loading="store.isLoading" @click="deletePlan">{{ t('planner.delete') }}</BaseButton>
            </div>
          </div>
        </div>

        <div class="weekly-progress">
          <h4>{{ t('planner.weeklyProgress') }}</h4>
          <div class="week-grid">
            <div v-for="day in weekDays" :key="day.date" class="day-cell" :class="{ 'day-cell--done': day.count >= store.planner.target_questions_per_day, 'day-cell--partial': day.count > 0 && day.count < store.planner.target_questions_per_day }">
              <span class="day-label">{{ day.label }}</span>
              <span class="day-count">{{ day.count }}</span>
            </div>
          </div>
        </div>
      </BaseCard>

      <BaseEmptyState v-else :title="t('planner.empty')" icon="bi bi-calendar-plus">
        <BaseButton variant="primary" @click="createDefault">{{ t('planner.createDefault') }}</BaseButton>
      </BaseEmptyState>
    </PageShell>
  </Layout>
</template>

<script setup>
import '@/assets/profile.css'
import { computed, onMounted, reactive } from 'vue'
import { useStudyPlannerStore } from '@/stores/studyPlannerStore'
import { useCategoryStore } from '@/stores/categoryStore'
import { useDialog } from '@/composables/useDialog'
import Layout from '@/components/common/Layout.vue'
import PageShell from '@/components/common/PageShell.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import ErrorBanner from '@/components/common/ErrorBanner.vue'
import FormGrid from '@/components/common/FormGrid.vue'
import BaseEmptyState from '@/components/base/BaseEmptyState.vue'

import { resolveIntlLocale } from '@/i18n/helpers/format'


const { t, locale } = useI18n()

const store = useStudyPlannerStore()
const categoryStore = useCategoryStore()
const { confirm } = useDialog()
function localIsoDate(d) {
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const editForm = reactive({
  target: 10,
  categories: [],
  tags: '',
  startDate: '',
  endDate: '',
})

const categoryOptions = computed(() =>
  categoryStore.items.map(c => ({ value: c.id, label: c.name }))
)

const progressPercent = computed(() => {
  if (!store.planner) return 0
  const target = store.planner.target_questions_per_day
  const done = store.todayProgress
  return Math.min((done / target) * 100, 100)
})

const weekDays = computed(() => {
  if (!store.planner) return []
  const today = new Date()
  const start = new Date(today)
  start.setDate(today.getDate() - 6)
  const days = []

  const intl = resolveIntlLocale(locale.value, 'ar-SA')
  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    const iso = localIsoDate(d)
    const count = store.planner.daily_progress?.[iso] || 0
    days.push({
      date: iso,
      label: d.toLocaleDateString(intl, { weekday: 'short' }),
      count,
    })
  }
  return days
})

async function loadPlanner() {
  await store.recordProgress()
  await store.fetchPlanner()
  if (store.planner) {
    editForm.target = store.planner.target_questions_per_day
    editForm.categories = store.planner.target_categories || []
    editForm.tags = (store.planner.target_tags || []).join(', ')
    editForm.startDate = store.planner.start_date
    editForm.endDate = store.planner.end_date || ''
  }
}

function createDefault() {
  store.updatePlanner({
    target_questions_per_day: 10,
    target_categories: [],
    target_tags: [],
    start_date: localIsoDate(new Date()),
  })
}

function savePlan() {
  const payload = {
    target_questions_per_day: editForm.target,
    target_categories: editForm.categories,
    target_tags: editForm.tags ? editForm.tags.split(',').map(t => t.trim()) : [],
    start_date: editForm.startDate || localIsoDate(new Date()),
    end_date: editForm.endDate || null,
  }
  store.updatePlanner(payload)
}

async function deletePlan() {
  if (await confirm(t('planner.deleteConfirm'))) {
    store.deletePlanner()
  }
}

onMounted(() => { categoryStore.fetchAll(); loadPlanner() })
</script>

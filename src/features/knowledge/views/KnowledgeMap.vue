<template>
  <Layout>
    <PageShell
      :title="t('knowledge.title')"
      icon="bi bi-map"
      :subtitle="t('knowledge.description')"
      page-class="knowledge-map-page"
    >
      <AsyncContent
        :loading="loading"
        :error="error || ''"
        skeleton-height="240px"
        @retry="load"
      >
      <template v-if="payload">
        <div class="knowledge-summary">
          <BaseCard v-for="stat in summaryStats" :key="stat.key" class="knowledge-summary__card">
            <i :class="stat.icon"></i>
            <strong>{{ stat.value }}</strong>
            <span>{{ t(stat.labelKey) }}</span>
          </BaseCard>
        </div>

        <div class="knowledge-map-page__filters">
          <BaseChip
            v-for="option in statusOptions"
            :key="option.value"
            interactive
            :active="activeStatus === option.value"
            variant="primary"
            @click="activeStatus = option.value"
          >
            {{ t(option.labelKey) }}
          </BaseChip>
        </div>

        <BaseEmptyState
          v-if="filteredItems.length === 0"
          icon="bi bi-map"
          :title="t('knowledge.empty')"
          :message="t('knowledge.emptyDescription')"
        />

        <section
          v-for="group in groupedItems"
          :key="group.name"
          class="knowledge-group"
        >
          <SectionHeader :title="group.name" compact />
          <div class="knowledge-grid">
            <BaseCard
              v-for="item in group.items"
              :key="item.id"
              class="knowledge-object-card"
              :class="`knowledge-object-card--${item.status}`"
            >
              <div class="knowledge-object-card__header">
                <div>
                  <h3>{{ item.title }}</h3>
                  <p>{{ item.learning_objective }}</p>
                </div>
                <BaseBadge :variant="statusVariant(item.status)">
                  {{ t(`knowledge.status.${item.status}`) }}
                </BaseBadge>
              </div>

              <div class="knowledge-meter" :aria-label="t('knowledge.mastery')">
                <span :style="{ width: `${item.mastery_score}%` }"></span>
              </div>
              <div class="knowledge-object-card__score">
                <strong>{{ item.mastery_score }}%</strong>
                <span>{{ t('knowledge.mastery') }}</span>
              </div>

              <dl class="knowledge-object-card__details">
                <div>
                  <dt>{{ t('knowledge.coverage') }}</dt>
                  <dd>{{ item.attempted_questions }}/{{ item.questions_count }}</dd>
                </div>
                <div>
                  <dt>{{ t('knowledge.attempts') }}</dt>
                  <dd>{{ item.total_attempts }}</dd>
                </div>
                <div>
                  <dt>{{ t('knowledge.confidence') }}</dt>
                  <dd>{{ confidenceLabel(item.average_confidence) }}</dd>
                </div>
              </dl>

              <BaseButton
                v-if="item.question_ids.length"
                variant="ghost"
                size="sm"
                :loading="startingId === item.id"
                @click="reviewObject(item)"
              >
                <i class="bi bi-play-circle"></i> {{ t('knowledge.review') }}
              </BaseButton>
            </BaseCard>
          </div>
        </section>
      </template>
      </AsyncContent>
    </PageShell>
  </Layout>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import Layout from '@/components/common/Layout.vue'
import PageShell from '@/components/common/PageShell.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseBadge from '@/components/base/BaseBadge.vue'
import BaseChip from '@/components/base/BaseChip.vue'
import BaseEmptyState from '@/components/base/BaseEmptyState.vue'
import AsyncContent from '@/components/common/AsyncContent.vue'
import SectionHeader from '@/components/common/SectionHeader.vue'
import { knowledgeService } from '@/services/knowledgeService'
import { useTestSessionStore } from '@/stores/testSessionStore'
import '@/assets/knowledge-map.css'

const { t } = useI18n()
const router = useRouter()
const sessionStore = useTestSessionStore()
const payload = ref(null)
const loading = ref(true)
const error = ref(null)
const activeStatus = ref('all')
const startingId = ref(null)

const statusOptions = [
  { value: 'all', labelKey: 'knowledge.status.all' },
  { value: 'mastered', labelKey: 'knowledge.status.mastered' },
  { value: 'developing', labelKey: 'knowledge.status.developing' },
  { value: 'needs_work', labelKey: 'knowledge.status.needs_work' },
  { value: 'unstarted', labelKey: 'knowledge.status.unstarted' },
]

const summaryStats = computed(() => {
  const summary = payload.value?.summary || {}
  return [
    { key: 'total', value: summary.total_objects || 0, labelKey: 'knowledge.total', icon: 'bi bi-diagram-3' },
    { key: 'mastered', value: summary.mastered_objects || 0, labelKey: 'knowledge.mastered', icon: 'bi bi-trophy' },
    { key: 'started', value: summary.started_objects || 0, labelKey: 'knowledge.started', icon: 'bi bi-lightning' },
    { key: 'average', value: `${summary.average_mastery || 0}%`, labelKey: 'knowledge.average', icon: 'bi bi-graph-up' },
  ]
})

const filteredItems = computed(() => {
  const items = payload.value?.items || []
  return activeStatus.value === 'all'
    ? items
    : items.filter(item => item.status === activeStatus.value)
})

const groupedItems = computed(() => {
  const groups = new Map()
  for (const item of filteredItems.value) {
    const name = item.category_name || t('knowledge.uncategorized')
    if (!groups.has(name)) groups.set(name, [])
    groups.get(name).push(item)
  }
  return [...groups.entries()].map(([name, items]) => ({ name, items }))
})

function confidenceLabel(value) {
  if (value == null) return t('knowledge.notAvailable')
  if (value >= 2.67) return t('tests.confidenceCertain')
  if (value >= 1.67) return t('tests.confidenceUncertain')
  return t('tests.confidenceGuessing')
}

function statusVariant(status) {
  return {
    mastered: 'success',
    developing: 'info',
    needs_work: 'warning',
    unstarted: 'secondary',
  }[status] || 'secondary'
}

async function reviewObject(item) {
  startingId.value = item.id
  try {
    const result = await sessionStore.start('study', {
      question_ids: item.question_ids,
      limit: item.question_ids.length,
      session_label: item.title,
      disable_timer: true,
    })
    if (result) router.push('/study/question')
  } finally {
    startingId.value = null
  }
}

async function load() {
  loading.value = true
  error.value = null
  try {
    payload.value = await knowledgeService.map()
  } catch (exc) {
    error.value = exc?.message || t('knowledge.loadFailed')
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

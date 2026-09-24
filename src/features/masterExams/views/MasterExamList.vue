<!-- frontend/src/features/masterExams/views/MasterExamList.vue -->
<template>
  <Layout>
    <PageShell
      :title="t('masterExams.listTitle')"
      icon="bi bi-mortarboard"
      page-class="master-exams-page"
    >
        <template #actions>
          <div class="master-exams-page__header-actions">
            <BaseButton
              v-if="authStore.can('master_exams.create')"
              variant="primary"
              @click="router.push('/master-exams/new')"
            >
              <i class="bi bi-plus-circle"></i> {{ t('masterExams.newButton') }}
            </BaseButton>
            <BaseButton
              v-if="authStore.can('master_exams.drafts_library')"
              variant="secondary"
              @click="router.push('/master-exams/drafts')"
            >
              <i class="bi bi-journal-text"></i> {{ t('masterExams.draftsButton') }}
            </BaseButton>
          </div>
        </template>
      <FeedbackRegion
        :error="masterExamStore.error"
        :retry="masterExamStore.error ? true : false"
        @dismiss="masterExamStore.error = null"
        @retry="load"
      />


      <TabStrip v-model="activeTab" :tabs="tabs" :aria-label="t('masterExams.listTitle')" />

      <BaseListContainer
        :loading="masterExamStore.isLoading"
        :items="visibleExams"
        :empty-title="emptyTitle"
        :empty-message="emptyMessage"
        empty-icon="bi-mortarboard"
      >
        <template #emptyActions>
          <BaseButton
            v-if="authStore.can('master_exams.create')"
            variant="primary"
            @click="router.push('/master-exams/new')"
          >
            <i class="bi bi-plus-circle"></i> {{ t('masterExams.createFirst') }}
          </BaseButton>
        </template>
        <template #default="{ items }">
          <div class="master-exams-grid stagger-list">
            <MasterExamCard
              v-for="exam in items"
              :key="exam.id"
              :exam="exam"
              @action="handleCardAction(exam, $event)"
            />
          </div>
        </template>
      </BaseListContainer>
    </PageShell>
  </Layout>
</template>

<script setup>
import '@/assets/master.css'
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Layout from '@/components/common/Layout.vue'
import PageShell from '@/components/common/PageShell.vue'
import TabStrip from '@/components/common/TabStrip.vue'
import BaseListContainer from '@/components/base/BaseListContainer.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import FeedbackRegion from '@/components/common/FeedbackRegion.vue'
import MasterExamCard from '../components/MasterExamCard.vue'
import { useAuthStore } from '@/stores/authStore'
import { useMasterExamStore } from '@/stores/masterExamStore'
import { useMasterExamAttemptStore } from '@/stores/masterExamAttemptStore'
import { useDialog } from '@/composables/useDialog'

const { t } = useI18n()

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const masterExamStore = useMasterExamStore()
const attemptStore = useMasterExamAttemptStore()
const { confirm } = useDialog()

const validTabs = new Set(['active', 'upcoming', 'mine', 'all'])
const initialTab = String(route.query.tab || 'active')
const activeTab = ref(validTabs.has(initialTab) ? initialTab : 'active')

watch(activeTab, (tab) => {
  router.replace({ query: { ...route.query, tab: tab === 'active' ? undefined : tab } })
})

watch(() => route.query.tab, (tab) => {
  const next = String(tab || 'active')
  activeTab.value = validTabs.has(next) ? next : 'active'
})

const tabs = computed(() => [
  {
    key: 'active',
    label: t('masterExams.tabActive'),
    icon: 'bi bi-broadcast',
    count: masterExamStore.activeExams.length,
  },
  {
    key: 'upcoming',
    label: t('masterExams.tabUpcoming'),
    icon: 'bi bi-calendar-event',
    count: masterExamStore.upcomingExams.length,
  },
  {
    key: 'mine',
    label: t('masterExams.tabMine'),
    icon: 'bi bi-person-badge',
    count: masterExamStore.ownedExams.length,
  },
  {
    key: 'all',
    label: t('masterExams.tabAll'),
    icon: 'bi bi-grid',
    count: masterExamStore.items.length,
  },
])

const visibleExams = computed(() => {
  switch (activeTab.value) {
    case 'active':
      return masterExamStore.activeExams
    case 'upcoming':
      return masterExamStore.upcomingExams
    case 'mine':
      return masterExamStore.ownedExams
    case 'all':
    default:
      return masterExamStore.items
  }
})

const emptyTitle = computed(() => {
  switch (activeTab.value) {
    case 'active':
      return t('masterExams.emptyActive')
    case 'upcoming':
      return t('masterExams.emptyUpcoming')
    case 'mine':
      return t('masterExams.emptyMine')
    default:
      return t('masterExams.emptyAll')
  }
})

const emptyMessage = computed(() => {
  switch (activeTab.value) {
    case 'active':
      return t('masterExams.emptyActiveDesc')
    case 'upcoming':
      return t('masterExams.emptyUpcomingDesc')
    case 'mine':
      return t('masterExams.emptyMineDesc')
    default:
      return ''
  }
})

async function load() {
  await masterExamStore.fetchList()
}

function previewExam(exam) {
  router.push(`/master-exams/${exam.id}/attempt?preview=1`)
}

async function handlePublish(exam) {
  if (!(await confirm(t('masterExams.publishConfirm', { name: exam.name })))) return
  const result = await masterExamStore.publish(exam.id)
  if (result) await load()
}

async function handleCancel(exam) {
  if (!(await confirm(t('masterExams.cancelConfirm', { name: exam.name })))) return
  const result = await masterExamStore.cancel(exam.id)
  if (result) await load()
}

async function startAttempt(exam, isMakeup) {
  const ok = await confirm(
    isMakeup
      ? t('masterExams.startMakeupConfirm', { name: exam.name })
      : t('masterExams.startConfirm', { name: exam.name }),
  )
  if (!ok) return
  const result = await attemptStore.start(exam.id, { preview: false })
  if (result) {
    router.push(`/master-exams/${exam.id}/attempt`)
  }
}

function resumeAttempt(exam) {
  router.push(`/master-exams/${exam.id}/attempt`)
}

function handleCardAction(exam, action) {
  const handlers = {
    edit: () => router.push(`/master-exams/${exam.id}/edit`),
    preview: () => previewExam(exam),
    publish: () => handlePublish(exam),
    cancel: () => handleCancel(exam),
    'view-results': () => router.push(`/master-exams/${exam.id}/results`),
    start: () => startAttempt(exam, false),
    'start-makeup': () => startAttempt(exam, true),
    resume: () => resumeAttempt(exam),
    'view-my-results': () => router.push(`/master-exams/${exam.id}/result`),
  }
  handlers[action]?.()
}

onMounted(load)
</script>

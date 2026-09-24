<!-- frontend/src/features/masterExams/components/MasterExamCard.vue -->
<template>
  <div
    class="master-exam-card"
    :class="[`master-exam-card--${status}`, { 'master-exam-card--makeup': isMakeup }]"
  >
    <div class="master-exam-card__icon">
      <i :class="statusIcon"></i>
    </div>

    <div class="master-exam-card__body">
      <div class="d-flex justify-between align-center flex-wrap gap-2 mb-2">
        <h3 class="master-exam-card__name" dir="auto">{{ exam.name }}</h3>
        <BaseBadge :variant="statusVariant" status>
          <i :class="statusIconSmall"></i>
          {{ statusLabel }}
        </BaseBadge>
      </div>

      <p v-if="exam.description" class="master-exam-card__description" dir="auto">
        {{ exam.description }}
      </p>

      <MetadataList :items="metadataItems" />

      <div v-if="showCountdown && countdownText" class="mt-2">
        <BaseBadge :variant="statusVariant" status>
          <i class="bi bi-hourglass-split"></i>
          {{ countdownText }}
        </BaseBadge>
      </div>
    </div>

    <div class="master-exam-card__actions">
      <!-- Owner actions (authoring) -->
      <template v-if="isOwner">
        <BaseButton
          v-if="exam.can_edit_now"
          variant="secondary"
          size="small"
          @click="emitAction('edit')"
        >
          <i class="bi bi-pencil"></i> {{ t('masterExams.edit') }}
        </BaseButton>
        <BaseButton
          v-if="exam.can_edit_now && (exam.question_count || 0) > 0"
          variant="secondary"
          size="small"
          @click="emitAction('preview')"
        >
          <i class="bi bi-eye"></i> {{ t('masterExams.preview') }}
        </BaseButton>
        <BaseButton
          v-if="exam.status === 'draft'"
          variant="primary"
          size="small"
          @click="emitAction('publish')"
        >
          <i class="bi bi-send"></i> {{ t('masterExams.publish') }}
        </BaseButton>
        <BaseButton
          v-if="exam.status !== 'draft' && exam.status !== 'cancelled'"
          variant="secondary"
          size="small"
          @click="emitAction('view-results')"
        >
          <i class="bi bi-bar-chart"></i> {{ t('masterExams.viewResults') }}
        </BaseButton>
        <BaseButton
          v-if="exam.status === 'scheduled' || exam.status === 'active'"
          variant="danger"
          size="small"
          @click="emitAction('cancel')"
        >
          <i class="bi bi-x-circle"></i> {{ t('masterExams.cancel') }}
        </BaseButton>
      </template>

      <!-- Participant actions -->
      <template v-else>
        <BaseButton v-if="canStart" variant="primary" size="small" @click="emitAction('start')">
          <i class="bi bi-play-circle"></i> {{ t('masterExams.start') }}
        </BaseButton>

        <BaseButton
          v-else-if="hasInProgress"
          variant="primary"
          size="small"
          @click="emitAction('resume')"
        >
          <i class="bi bi-play-circle-fill"></i> {{ t('masterExams.resume') }}
        </BaseButton>

        <BaseButton
          v-else-if="canMakeup"
          variant="primary"
          size="small"
          @click="emitAction('start-makeup')"
        >
          <i class="bi bi-arrow-repeat"></i> {{ t('masterExams.makeup') }}
        </BaseButton>

        <template v-else-if="hasCompleted">
          <BaseButton variant="secondary" size="small" @click="emitAction('view-my-results')">
            <i class="bi bi-trophy"></i> {{ t('masterExams.viewMyResults') }}
          </BaseButton>
        </template>

        <span v-else class="text-muted master-exam-card__locked-hint">
          <i class="bi bi-lock"></i>
          {{
            exam.status === 'cancelled'
              ? t('masterExams.cancelledLabel')
              : t('masterExams.windowClosed')
          }}
        </span>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseBadge from '@/components/base/BaseBadge.vue'
import MetadataList from '@/components/common/MetadataList.vue'
import { useLocaleFormatters } from '@/i18n/helpers/format'

const { t } = useI18n()
const { formatDate } = useLocaleFormatters()

const props = defineProps({
  exam: { type: Object, required: true },
  context: {
    type: String,
    default: 'auto',
    validator: (value) => ['auto', 'owner', 'participant'].includes(value),
  },
})

const emit = defineEmits(['action'])

const isOwner = computed(
  () => props.context === 'owner' || (props.context === 'auto' && Boolean(props.exam.is_owner)),
)
const hasInProgress = computed(() =>
  Boolean(props.exam.my_attempt && !props.exam.my_attempt.is_complete),
)
const hasCompleted = computed(() => Boolean(props.exam.my_attempt?.is_complete))
const canStart = computed(
  () => props.exam.status === 'active' && !hasInProgress.value && !hasCompleted.value,
)
const canMakeup = computed(
  () =>
    props.exam.status === 'completed' &&
    Boolean(props.exam.allow_makeup) &&
    !hasInProgress.value &&
    !hasCompleted.value,
)
const isMakeup = computed(() => Boolean(props.exam.my_attempt?.is_makeup))
const metadataItems = computed(() => [
  {
    key: 'questions',
    icon: 'bi bi-question-circle',
    value: t('masterExams.questionCount', { n: props.exam.question_count || 0 }),
  },
  {
    key: 'duration',
    icon: 'bi bi-clock',
    value: t('masterExams.minutesShort', { n: props.exam.duration_minutes }),
  },
  { key: 'opens', icon: 'bi bi-calendar-event', value: formatDate(props.exam.opens_at) },
  {
    key: 'attending',
    icon: 'bi bi-person',
    value: props.exam.primary_attending_name || props.exam.primary_attending_username || '—',
  },
])

function emitAction(type) {
  emit('action', type)
}

const status = computed(() => props.exam.status || 'draft')
const statusVariant = computed(
  () =>
    ({
      draft: 'secondary',
      scheduled: 'info',
      active: 'success',
      completed: 'success',
      published_to_bank: 'info',
      cancelled: 'danger',
    })[status.value] || 'secondary',
)

const statusIcon = computed(
  () =>
    ({
      draft: 'bi bi-pencil-square',
      scheduled: 'bi bi-calendar-event',
      active: 'bi bi-broadcast',
      completed: 'bi bi-check-circle',
      published_to_bank: 'bi bi-collection',
      cancelled: 'bi bi-x-circle',
    })[status.value] || 'bi bi-mortarboard',
)

const statusIconSmall = computed(
  () =>
    ({
      draft: 'bi bi-pencil',
      scheduled: 'bi bi-clock-history',
      active: 'bi bi-record-circle',
      completed: 'bi bi-check-lg',
      published_to_bank: 'bi bi-patch-check',
      cancelled: 'bi bi-x-lg',
    })[status.value] || 'bi bi-circle',
)

const statusLabel = computed(() => {
  const key = {
    draft: 'masterExams.statusDraft',
    scheduled: 'masterExams.statusScheduled',
    active: 'masterExams.statusActive',
    completed: 'masterExams.statusCompleted',
    published_to_bank: 'masterExams.statusPublished',
    cancelled: 'masterExams.statusCancelled',
  }[status.value]
  return key ? t(key) : status.value
})

const showCountdown = computed(() => status.value === 'scheduled' || status.value === 'active')

const now = ref(Date.now())
let timer = null
onMounted(() => {
  timer = setInterval(() => {
    now.value = Date.now()
  }, 30_000)
})
onBeforeUnmount(() => {
  if (timer) clearInterval(timer)
})

const countdownText = computed(() => {
  if (!props.exam.opens_at) return ''
  const opens = new Date(props.exam.opens_at).getTime()
  const closes = new Date(props.exam.closes_at).getTime()
  const tNow = now.value

  if (tNow < opens) {
    const diff = opens - tNow
    const days = Math.floor(diff / 86_400_000)
    const hours = Math.floor((diff % 86_400_000) / 3_600_000)
    const mins = Math.floor((diff % 3_600_000) / 60_000)
    let value
    if (days >= 1) value = t('masterExams.daysShort', { n: days })
    else if (hours >= 1) value = t('masterExams.hoursShort', { n: hours })
    else value = t('masterExams.minutesShort', { n: mins })
    return t('masterExams.opensIn', { value })
  }
  if (tNow < closes) {
    const diff = closes - tNow
    const hours = Math.floor(diff / 3_600_000)
    const mins = Math.floor((diff % 3_600_000) / 60_000)
    let value
    if (hours >= 1) value = t('masterExams.hoursShort', { n: hours })
    else value = t('masterExams.minutesShort', { n: mins })
    return t('masterExams.closesIn', { value })
  }
  return ''
})
</script>

<!-- frontend/src/features/questions/components/QuestionCard.vue -->
<template>
  <BaseCard
    class="question-card"
    :class="[
      question.verified ? 'question-card--verified' : 'question-card--unverified',
      { 'question-card--selected': selected },
    ]"
    :variant="difficultyVariant"
  >
    <Transition name="stamp">
      <div v-if="showStamp" class="question-card__stamp">
        <i class="bi bi-patch-check-fill"></i>
      </div>
    </Transition>

    <details v-if="question.case?.stem" class="question-card__case" open>
      <summary class="question-card__case-summary">
        <i class="bi bi-journal-medical"></i>
        <span>{{ t('questions.caseClinicalTitle') }}</span>
        <span v-if="question.case.key" class="question-card__case-group">
          {{ question.case.key }}
        </span>
        <span v-if="question.case_sibling_count > 1" class="question-card__case-count">
          {{ t('questions.caseQuestionCount', { n: question.case_sibling_count }) }}
        </span>
      </summary>
      <div class="question-card__case-body" dir="auto">
        <BaseMarkdown :text="question.case.stem" />
      </div>
    </details>

    <div class="question-card__header">
      <div class="question-card__top">
        <div class="question-card__title" dir="auto">
          <span class="question-card__text">
            <BaseMarkdown :text="question.question" inline />
          </span>
        </div>
        <div class="question-card__badges">
          <BaseBadge v-if="question.case" variant="info" status>
            <i class="bi bi-journal-medical"></i> {{ t('questions.caseBadge') }}
          </BaseBadge>
          <BaseBadge :variant="question.verified ? 'success' : 'warning'" status>
            <i
              :class="
                question.verified
                  ? 'bi bi-patch-check-fill icon-verified'
                  : 'bi bi-patch-check icon-unverified'
              "
            ></i>
            {{ question.verified ? t('questions.verified') : t('questions.unverified') }}
          </BaseBadge>
          <DifficultyBadge :difficulty="question.difficulty" />
        </div>
      </div>

      <QuestionCardActions
        :question="question"
        :bookmarked="bookmarked"
        :selected="selected"
        :show-select="showSelect"
        @toggle-select="$emit('toggle-select')"
        @bookmark="$emit('bookmark')"
        @edit="$emit('edit')"
        @delete="$emit('delete')"
        @verify="$emit('verify')"
        @flag="$emit('flag')"
        @duplicate="$emit('duplicate')"
      />
    </div>

    <div class="question-card__choices">
      <strong>{{ t('questions.choicesLabel') }}:</strong>
      <ol class="choices-list">
        <li
          v-for="(choice, idx) in choices"
          :key="idx"
          class="choice-item"
          :class="{ 'choice-item--correct': idx + 1 === question.correct_answer }"
          dir="auto"
        >
          {{ idx + 1 }}. {{ choice }}
          <i v-if="idx + 1 === question.correct_answer" class="bi bi-check-lg text-success"></i>
        </li>
      </ol>
    </div>

    <div v-if="question.explanation" class="question-card__explanation">
      <button
        type="button"
        class="explanation-toggle"
        :aria-expanded="explanationExpanded"
        @click="explanationExpanded = !explanationExpanded"
      >
        <strong><i class="bi bi-lightbulb"></i> {{ t('questions.explanationLabel') }}:</strong>
        <span class="toggle-indicator">
          <i :class="explanationExpanded ? 'bi bi-chevron-up' : 'bi bi-chevron-down'"></i>
          {{ explanationExpanded ? t('questions.explainHide') : t('questions.explainShow') }}
        </span>
      </button>
      <Transition name="explanation">
        <p v-if="explanationExpanded" dir="auto" class="explanation-text">
          {{ question.explanation }}
        </p>
      </Transition>
    </div>

    <div class="question-card__rating">
      <span class="rating-label"><i class="bi bi-star"></i> {{ t('questions.rating') }}</span>
      <button
        v-for="star in 5"
        :key="star"
        class="star-btn"
        :class="{ active: star <= (userRating || 0) }"
        :disabled="ratingLoading"
        @click="rate(star)"
        :aria-label="t('questions.ratingAria', { star })"
      >
        <i :class="star <= (userRating || 0) ? 'bi bi-star-fill' : 'bi bi-star'"></i>
      </button>
      <span v-if="avgRating > 0" class="rating-avg">
        {{ avgRating.toFixed(1) }} ({{ ratingCount }})
      </span>
    </div>

    <div v-if="question.source" class="question-card__source">
      <strong><i class="bi bi-book"></i> {{ t('questions.sourceLabel') }}:</strong>
      {{ question.source }}
    </div>

    <div class="question-card__meta">
      <span class="question-card__author">
        <i class="bi bi-person"></i>
        {{ question.authored_by_username || t('questions.unknownAuthor') }}
        <BaseBadge
          v-if="question.authored_by_rank"
          :variant="authorRankVariant"
          :title="t('profile.rankLabel')"
          class="author-rank-badge"
        >
          <i :class="authorRankIcon"></i>
          {{ authorRankLabel }}
        </BaseBadge>
      </span>
      <span
        v-if="ownershipDiffers"
        class="question-card__owner"
        :title="t('questions.ownedByTooltip')"
      >
        <i class="bi bi-shield-check"></i>
        {{ t('questions.ownedBy', { username: question.owned_by_username }) }}
      </span>
      <span><i class="bi bi-calendar"></i> {{ formatDate(question.created_at) }}</span>
      <span v-if="question.updated_at">
        <i class="bi bi-clock-history"></i>
        {{ t('questions.lastUpdated', { date: formatDate(question.updated_at) }) }}
      </span>
      <span>
        <i class="bi bi-eye"></i>
        {{ t('questions.timesAnswered', { count: question.times_answered || 0 }) }}
      </span>
      <span>
        <i class="bi bi-check2"></i>
        {{ t('questions.timesCorrect', { count: question.times_correct || 0 }) }}
      </span>
      <span v-if="question.tags && question.tags.length" class="tags">
        <i class="bi bi-tags"></i>
        <span v-for="tag in question.tags" :key="tag" class="chip">{{ tag }}</span>
      </span>
    </div>
  </BaseCard>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { formatDate } from '@/utils/formatters'
import { useNotify } from '@/composables/useNotify'
import { useDebounceFn } from '@/composables/useDebounceFn'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseBadge from '@/components/base/BaseBadge.vue'
import BaseMarkdown from '@/components/markdown/BaseMarkdown.vue'
import DifficultyBadge from '@/components/base/DifficultyBadge.vue'
import QuestionCardActions from './QuestionCardActions.vue'
import { enqueueRating } from '../composables/useRatingBatcher'
import { useQuestionStore } from '@/stores/questionStore'
import { authorRankVariantFor, authorRankIconFor, authorRankLabelFor } from '@/utils/authorRank'

const { t } = useI18n()

const props = defineProps({
  question: { type: Object, required: true },
  bookmarked: Boolean,
  selected: Boolean,
  showSelect: Boolean,
})
const emit = defineEmits([
  'toggle-select',
  'bookmark',
  'edit',
  'delete',
  'verify',
  'flag',
  'duplicate',
])

const { notify } = useNotify()
const questionStore = useQuestionStore()

const explanationExpanded = ref(false)
const showStamp = ref(false)

const userRating = ref(0)
const avgRating = ref(0)
const ratingCount = ref(0)
const ratingLoading = ref(false)

watch(
  () => props.question.verified,
  (newVal, oldVal) => {
    if (newVal && !oldVal) {
      showStamp.value = true
      setTimeout(() => {
        showStamp.value = false
      }, 600)
    }
  },
)

const difficultyVariant = computed(() => {
  if (props.question.difficulty === 'easy') return 'success'
  if (props.question.difficulty === 'hard') return 'danger'
  return 'warning'
})

const ownershipDiffers = computed(() => {
  const author = props.question.authored_by_username
  const owner = props.question.owned_by_username
  return Boolean(owner) && owner !== author
})

const authorRankVariant = computed(() =>
  authorRankVariantFor(props.question?.authored_by_rank?.key),
)

const authorRankIcon = computed(() => authorRankIconFor(props.question?.authored_by_rank?.key))

const authorRankLabel = computed(() => {
  const rank = props.question?.authored_by_rank
  if (!rank) return ''
  return authorRankLabelFor(rank.key, t, rank.label || '')
})

const choices = computed(() => props.question.choices || [])

async function fetchRating() {
  try {
    const data = await enqueueRating(props.question.id)
    if (!data) return
    userRating.value = data.user_rating
    avgRating.value = data.average
    ratingCount.value = data.count
  } catch (err) {
    console.warn(`Failed to fetch rating for question ${props.question.id}:`, err)
  }
}

const RATE_DEBOUNCE_MS = 500

async function executeRate(val) {
  if (ratingLoading.value) return
  ratingLoading.value = true
  try {
    await questionStore.rate(props.question.id, val)
    userRating.value = val
    await fetchRating()
    notify(t('questions.ratingSuccess'), 'success')
  } catch (err) {
    console.error(`Failed to rate question ${props.question.id}:`, err)
    notify(t('questions.ratingFailed'), 'error')
  } finally {
    ratingLoading.value = false
  }
}

const { debounced: debouncedRate } = useDebounceFn(executeRate, RATE_DEBOUNCE_MS)

function rate(val) {
  if (ratingLoading.value) return
  debouncedRate(val)
}

onMounted(fetchRating)
</script>

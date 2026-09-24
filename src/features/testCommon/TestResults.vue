<!-- frontend/src/features/testCommon/TestResults.vue -->
<template>
  <Layout>
    <PageShell
      :title="t(config.resultsTitleKey)"
      icon="bi bi-trophy"
      page-class="test-results"
    >
      <BaseCard class="test-results__summary">
        <p v-if="tag" class="text-muted"><i class="bi bi-tag"></i> {{ t('tests.resultsTagLabel') }}: <span class="test-tag">{{ tag }}</span></p>
        <AlertBox v-if="showWarning" variant="warning" :message="warningMessage" />
        <div class="test-results__score">
          <span class="score-number" :class="scoreClass">{{ formatNumber(correctCount) }}/{{ formatNumber(totalQuestions) }}</span>
          <span class="score-percent" :class="scoreClass">{{ formatPercent(animatedAccuracy, 1) }}</span>
        </div>
        <ProgressBar :progress="animatedAccuracy" :label="t('tests.resultsAccuracy')" />
        <div class="test-results__stats">
          <StatTile :value="formatNumber(totalQuestions)" :label="t('tests.resultsTotal')" />
          <StatTile :value="formatNumber(correctCount)" :label="t('tests.resultsCorrect')" />
          <StatTile v-if="showAnsweredCount" :value="formatNumber(answeredCount)" :label="t('tests.resultsAnswered')" />
          <StatTile v-if="showTime" :value="formattedTotalTime" :label="t('tests.resultsTotalTime')" />
        </div>

        <div v-if="fragileCount > 0" class="fragile-callout">
          <i class="bi bi-shield-slash"></i>
          <div class="fragile-callout__body">
            <span class="fragile-callout__title">
              <i class="bi bi-info-circle"></i> {{ t('questions.fragileTitle') }}
            </span>
            <p class="fragile-callout__text">
              {{ t('tests.fragileCallout', { count: fragileCount }) }}
              <router-link to="/questions/fragile">{{ t('questions.fragileTitle') }}</router-link>
            </p>
          </div>
        </div>

        <div v-if="categoryBreakdown.length || difficultyBreakdown.length" class="breakdown-section">
          <h4><i class="bi bi-graph-up"></i> {{ t('tests.breakdown') }}</h4>
          <div v-if="categoryBreakdown.length" class="breakdown-group">
            <h5>{{ t('tests.breakdownByCategory') }}</h5>
            <div v-for="cat in categoryBreakdown" :key="cat.name" class="breakdown-row">
              <span class="breakdown-label">{{ cat.name }}</span>
              <span class="breakdown-value">{{ cat.correct }}/{{ cat.total }} ({{ formatPercent(cat.accuracy) }})</span>
            </div>
          </div>
          <div v-if="difficultyBreakdown.length" class="breakdown-group">
            <h5>{{ t('tests.breakdownByDifficulty') }}</h5>
            <div v-for="diff in difficultyBreakdown" :key="diff.name" class="breakdown-row">
              <span class="breakdown-label">{{ diff.name }}</span>
              <span class="breakdown-value">{{ diff.correct }}/{{ diff.total }} ({{ formatPercent(diff.accuracy) }})</span>
            </div>
          </div>
        </div>

        <div class="print-only">
          <h3>{{ t('tests.breakdown') }}</h3>
          <table class="print-table">
            <thead>
              <tr>
                <th>{{ t('tests.printTableCategory') }}</th>
                <th>{{ t('tests.printTableCorrect') }}</th>
                <th>{{ t('tests.printTableTotal') }}</th>
                <th>{{ t('tests.printTableAccuracy') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="cat in categoryBreakdown" :key="cat.name">
                <td>{{ cat.name }}</td><td>{{ cat.correct }}</td><td>{{ cat.total }}</td><td>{{ formatPercent(cat.accuracy) }}</td>
              </tr>
              <tr v-for="diff in difficultyBreakdown" :key="diff.name">
                <td>{{ diff.name }}</td><td>{{ diff.correct }}</td><td>{{ diff.total }}</td><td>{{ formatPercent(diff.accuracy) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="motivational-quote no-print">
          <Transition name="fade" mode="out-in">
            <p :key="quoteKey"><i class="bi bi-quote"></i> {{ randomQuote }}</p>
          </Transition>
          <BaseIconButton
            class="quote-refresh"
            icon="bi bi-arrow-repeat"
            variant="ghost"
            :label="t('tests.newQuote')"
            @click="refreshQuote"
          />
        </div>

        <div class="test-results__actions no-print">
          <BaseButton variant="primary" @click="$emit('retry')">
            <i class="bi bi-arrow-repeat"></i> {{ t(config.retryLabelKey) }}
          </BaseButton>
          <BaseButton variant="secondary" @click="$emit('home')">
            <i class="bi bi-house"></i> {{ t('tests.home') }}
          </BaseButton>
          <BaseButton v-if="showShare" variant="secondary" @click="shareResults">
            <i class="bi bi-share"></i> {{ t('tests.share') }}
          </BaseButton>
        </div>
      </BaseCard>

      <SectionHeader class="no-print" :title="t('tests.reviewDetail')" icon="bi bi-list-check" />
      <ReviewItem v-for="(result, idx) in results.results" :key="idx" :result="result" :index="idx + 1" />
    </PageShell>
  </Layout>
</template>

<script setup>
import { computed } from 'vue'
import Layout from '@/components/common/Layout.vue'
import PageShell from '@/components/common/PageShell.vue'
import SectionHeader from '@/components/common/SectionHeader.vue'
import BaseIconButton from '@/components/base/BaseIconButton.vue'
import ProgressBar from '@/components/common/ProgressBar.vue'
import ReviewItem from '@/components/common/ReviewItem.vue'
import StatTile from '@/components/base/StatTile.vue'
import AlertBox from '@/components/common/AlertBox.vue'
import { formatTime } from '@/utils/timer'
import { useLocaleFormatters } from '@/i18n/helpers/format'
import { useCountUp } from '@/composables/useCountUp'
import { useRotatingContent } from '@/composables/useRotatingContent'
import { copyTextToClipboard } from '@/utils/clipboard'
import { useNotify } from '@/composables/useNotify'
import { MODES } from './modes'
import { selectMotivationalQuotes, DIFFICULTY_LABEL_KEYS } from '@/utils/constants'

const { t, locale } = useI18n()
const { formatNumber, formatPercent } = useLocaleFormatters()

const props = defineProps({
  results: { type: Object, required: true },
  mode: { type: String, required: true },
  tag: { type: String, default: '' },
  showWarning: { type: Boolean, default: false },
  warningMessage: { type: String, default: '' },
  showAnsweredCount: { type: Boolean, default: false },
  showTime: { type: Boolean, default: false },
  showShare: { type: Boolean, default: false },
})

const emit = defineEmits(['retry', 'home'])
const { notify } = useNotify()

const config = computed(() => MODES[props.mode] || MODES.exam)

const totalQuestions = computed(() => props.results.total_questions || 0)
const correctCount = computed(() => props.results.correct_count || 0)
const answeredCount = computed(() => props.results.answered_count ?? totalQuestions.value)
const accuracy = computed(() => props.results.accuracy || 0)
const formattedTotalTime = computed(() => formatTime(props.results.total_time || 0))
const fragileCount = computed(() => props.results.confidence_fragile || 0)

const scoreClass = computed(() => {
  if (accuracy.value >= 80) return 'score--great'
  if (accuracy.value >= 50) return 'score--ok'
  return 'score--low'
})

function groupByResults(results, keyFn, nameFn) {
  const map = {}
  for (const r of results || []) {
    const key = keyFn(r)
    if (!map[key]) {
      map[key] = { name: nameFn(r, key), correct: 0, total: 0 }
    }
    map[key].total += 1
    if (r.is_correct) map[key].correct += 1
  }
  return Object.values(map).map((item) => ({
    ...item,
    accuracy: item.total ? Math.round((item.correct / item.total) * 100) : 0,
  }))
}

const categoryBreakdown = computed(() =>
  groupByResults(
    props.results.results,
    (r) => r.category_id || 'uncategorized',
    (r) => r.category_name || t('common.noData'),
  ),
)

const difficultyBreakdown = computed(() =>
  groupByResults(
    props.results.results,
    (r) => r.difficulty || 'unknown',
    (r, key) => {
      const labelKey = DIFFICULTY_LABEL_KEYS[key]
      return labelKey ? t(labelKey) : key
    },
  ),
)

// ──────────────────────────────────────────────────────────────────
// Quote rotation now uses the shared `useRotatingContent` composable.
//
// The pool is a computed over `locale`: `selectMotivationalQuotes`
// returns a module-level array, so the computed only produces a
// new identity when the user switches language. The composable's
// pool watcher fires on that identity change and shuffles, which
// preserves the original locale-reactivity without any explicit
// locale watcher here.
//
// `refreshQuote` is the composable's `advance` — the original
// function was a straight step-to-next, matching `advance` exactly.
// ──────────────────────────────────────────────────────────────────
const quotePool = computed(() => selectMotivationalQuotes(locale.value))

const {
  current: randomQuote,
  key: quoteKey,
  advance: refreshQuote,
} = useRotatingContent({
  pool: quotePool,
  intervalMs: 600000,
})

const { displayValue: animatedAccuracy } = useCountUp(accuracy, 800, true)

async function shareResults() {
  const text = t('tests.shareText', {
    title: t(config.value.resultsTitleKey),
    correct: correctCount.value,
    total: totalQuestions.value,
    accuracy: accuracy.value.toFixed(1),
  })

  if (navigator.share) {
    try {
      await navigator.share({
        title: t(config.value.resultsTitleKey),
        text,
        url: window.location.href,
      })
    } catch {
      // User dismissed the share sheet — not an error.
    }
    return
  }

  const ok = await copyTextToClipboard(text)
  notify(
    ok ? t('tests.shareCopied') : t('tests.shareFailed'),
    ok ? 'success' : 'error',
  )
}
</script>

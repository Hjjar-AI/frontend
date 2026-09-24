<!-- frontend/src/components/dashboard/StudyActivityHeatmap.vue -->

<template>
  <BaseCard class="heatmap-card">
    
    <BaseButton
      variant="ghost"
      raw-content
      class="heatmap-card__toggle"
      :aria-expanded="expanded"
      aria-controls="heatmap-body"
      :title="expanded
        ? t('dashboard.heatmapCollapse')
        : t('dashboard.heatmapExpand')"
      @click="expanded = !expanded"
    >
      <span class="heatmap-card__toggle-left">
        <i class="bi bi-grid-3x3-gap"></i>
        <span class="heatmap-card__toggle-title">{{ t('dashboard.heatmapTitle') }}</span>
        <i
          class="bi bi-chevron-down heatmap-card__toggle-arrow"
          :class="{ 'heatmap-card__toggle-arrow--open': expanded }"
          aria-hidden="true"
        ></i>
      </span>

      <span class="heatmap-card__stats">
        <span class="heatmap-stat">
          <strong>{{ formatNumber(data.total_questions) }}</strong>
          {{ t('dashboard.heatmapTotalQuestions') }}
        </span>
        <span class="heatmap-stat">
          <strong>{{ data.active_days }}</strong>
          {{ t('dashboard.heatmapActiveDays') }}
        </span>
        <span v-if="data.current_streak > 0" class="heatmap-stat heatmap-stat--streak">
          🔥 <strong>{{ data.current_streak }}</strong>
        </span>
      </span>
    </BaseButton>

    
    <div v-show="expanded" id="heatmap-body" class="heatmap-card__body">
      <div class="heatmap-scroll">
        <!-- Month labels row -->
        <div
          v-if="monthLabels.length"
          class="heatmap-months"
          :style="monthsStyle"
        >
          <span
            v-for="(label, i) in monthLabels"
            :key="i"
            class="heatmap-months__label"
            :style="{ gridColumnStart: label.col }"
          >
            {{ label.text }}
          </span>
        </div>

        <!-- The grid -->
        <div class="heatmap-grid" :style="gridStyle">
          <!-- Day-of-week labels -->
          <!-- Day-of-week labels -->
<div class="heatmap-grid__day-labels">
  <span
    v-for="(d, i) in dayLabels"
    :key="i"
    class="heatmap-grid__day-label"
    :style="{
      gridRow: i + 1,
      visibility: showDayLabel(i) ? 'visible' : 'hidden',
    }"
  >
    {{ d }}
  </span>
</div>

          <!-- Cells -->
          <div
            v-for="(cell, idx) in cells"
            :key="idx"
            class="heatmap-cell"
            :class="cellClass(cell.count)"
            :title="cellTooltip(cell)"
          ></div>
        </div>
      </div>

      <!-- Legend -->
      <div class="heatmap-legend">
        <span class="heatmap-legend__label">{{ t('dashboard.heatmapLess') }}</span>
        <span class="heatmap-cell heatmap-cell--0"></span>
        <span class="heatmap-cell heatmap-cell--1"></span>
        <span class="heatmap-cell heatmap-cell--2"></span>
        <span class="heatmap-cell heatmap-cell--3"></span>
        <span class="heatmap-cell heatmap-cell--4"></span>
        <span class="heatmap-legend__label">{{ t('dashboard.heatmapMore') }}</span>
      </div>
    </div>
  </BaseCard>
</template>

<script setup>
import { computed, ref } from 'vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import { formatNumber } from '@/utils/formatters'

const { t } = useI18n()

const props = defineProps({
  data: {
    type: Object,
    required: true,
    // Expected shape:
    // { days: [{date, count}], total_questions, active_days,
    //   max_daily, current_streak, longest_streak }
  },
})

// Default closed. The dashboard's above-the-fold content should be
// the study action cards, not a year-long activity grid.
const expanded = ref(false)


function parseUtcDate(iso) {
  return new Date(iso + 'T00:00:00Z')
}

const sortedDays = computed(() => {
  if (!props.data?.days?.length) return []
  return [...props.data.days].sort((a, b) =>
    a.date < b.date ? -1 : a.date > b.date ? 1 : 0
  )
})

// ── Grid computation ────────────────────────────────────────────────
// GitHub-style: columns = weeks, rows = 7 (one per day of week).
//
// The container carries `direction: ltr` (see heatmap.css), so the
// column numbering below is valid in every locale without
// direction-aware branching.

const cells = computed(() => {
  const days = sortedDays.value
  if (!days.length) return []

  // 0=Sun, 1=Mon, ..., 6=Sat. This is the weekday of the OLDEST day
  // in the window, and it is also the number of empty padding cells
  // needed to land that day in the correct row.
  const startDayOfWeek = parseUtcDate(days[0].date).getUTCDay()

  const padded = []
  for (let i = 0; i < startDayOfWeek; i++) {
    padded.push({ date: null, count: -1 }) // -1 = empty padding cell
  }
  padded.push(...days)
  return padded
})

const totalWeeks = computed(() => Math.ceil(cells.value.length / 7))

// Column template used by both the month row and the week grid.
// Column 1 is a fixed 24 px spacer matching the day-of-week label
// column; columns 2..N+1 are fixed 11 px cells (matching
// `.heatmap-cell`'s width).
//
// Fixed widths — rather than `1fr` — keep the grid's intrinsic size
// deterministic regardless of the container. That is what makes the
// scroll wrapper work: on a narrow viewport the columns keep their
// intended 11 px size and the wrapper scrolls, instead of the
// columns collapsing to sub-pixel widths.
const columnTemplate = computed(
  () => `24px repeat(${totalWeeks.value}, 11px)`,
)

const monthsStyle = computed(() => ({
  gridTemplateColumns: columnTemplate.value,
}))

const gridStyle = computed(() => ({
  gridTemplateColumns: columnTemplate.value,
  gridTemplateRows: 'repeat(7, 11px)',
}))

// ── Month labels ────────────────────────────────────────────────────
const monthLabels = computed(() => {
  const days = sortedDays.value
  if (!days.length) return []

  const startDayOfWeek = parseUtcDate(days[0].date).getUTCDay()
  const monthFmt = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    timeZone: 'UTC',
  })

  const labels = []
  let lastMonth = -1
  for (let i = 0; i < days.length; i++) {
    const d = parseUtcDate(days[i].date)
    const month = d.getUTCMonth()
    if (month !== lastMonth) {
      lastMonth = month
      // +2 for the day-label spacer column, and because
      // gridColumnStart is 1-indexed.
      const col = Math.floor((i + startDayOfWeek) / 7) + 2
      labels.push({ col, text: monthFmt.format(d) })
    }
  }
  return labels
})

// ── Day-of-week labels ──────────────────────────────────────────────
//
// Build the seven narrow weekday labels from a known Sunday
// expressed in UTC, and format in UTC. The explicit timeZone
// removes any dependence on the host's timezone; the fixed reference
// date (2024-01-07, verified Sunday) removes any dependence on the
// current session's clock.
const dayLabels = computed(() => {
  const sundayUtc = Date.UTC(2024, 0, 7)
  const fmt = new Intl.DateTimeFormat(undefined, {
    weekday: 'narrow',
    timeZone: 'UTC',
  })
  return Array.from({ length: 7 }, (_, i) =>
    fmt.format(new Date(sundayUtc + i * 86_400_000))
  )
})
const VISIBLE_DAY_ROWS = new Set([2, 4, 6])

function showDayLabel(i) {
  return VISIBLE_DAY_ROWS.has(i)
}
// ── Cell styling ────────────────────────────────────────────────────
function cellClass(count) {
  if (count < 0) return 'heatmap-cell--pad'
  if (count === 0) return 'heatmap-cell--0'
  const max = props.data.max_daily || 1
  const ratio = count / max
  if (ratio <= 0.25) return 'heatmap-cell--1'
  if (ratio <= 0.5) return 'heatmap-cell--2'
  if (ratio <= 0.75) return 'heatmap-cell--3'
  return 'heatmap-cell--4'
}

function cellTooltip(cell) {
  if (!cell.date) return ''
  if (cell.count === 0) {
    return `${cell.date}: ${t('dashboard.heatmapNoActivity')}`
  }
  return `${cell.date}: ${t('dashboard.heatmapQuestions', { count: cell.count })}`
}
</script>

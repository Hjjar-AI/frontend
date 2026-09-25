<!-- frontend/src/components/dashboard/StudyActivityHeatmap.vue -->

<template>
  <BaseCard class="heatmap-card">
    <BaseButton
      variant="ghost"
      raw-content
      class="heatmap-card__toggle"
      :aria-expanded="expanded"
      aria-controls="heatmap-body"
      :title="expanded ? t('dashboard.heatmapCollapse') : t('dashboard.heatmapExpand')"
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
          <strong>{{ formatNumber(visibleStats.totalQuestions) }}</strong>
          {{ t('dashboard.heatmapTotalQuestions') }}
        </span>
        <span class="heatmap-stat">
          <strong>{{ formatNumber(visibleStats.activeDays) }}</strong>
          {{ t('dashboard.heatmapActiveDays') }}
        </span>
        <span v-if="data.current_streak > 0" class="heatmap-stat heatmap-stat--streak">
          <i class="bi bi-lightning-charge-fill" aria-hidden="true"></i>
          <strong>{{ formatNumber(data.current_streak) }}</strong>
        </span>
      </span>
    </BaseButton>

    <div v-show="expanded" id="heatmap-body" class="heatmap-card__body">
      <div class="heatmap-card__range">{{ visibleRangeLabel }}</div>

      <div class="heatmap-scroll">
        <!-- Month labels row -->
        <div v-if="monthLabels.length" class="heatmap-months" :style="monthsStyle">
          <span
            v-for="label in monthLabels"
            :key="label.key"
            class="heatmap-months__label"
            :style="{ gridColumn: `${label.col} / span ${label.span}` }"
          >
            {{ label.text }}
          </span>
        </div>

        <!-- The grid -->
        <div class="heatmap-grid" :style="gridStyle">
          <!-- Day-of-week labels -->
          <span
            v-for="(day, i) in dayLabels"
            :key="day.key"
            class="heatmap-grid__day-label"
            :style="{
              gridColumn: 1,
              gridRow: i + 1,
              visibility: showDayLabel(i) ? 'visible' : 'hidden',
            }"
          >
            {{ day.text }}
          </span>

          <!-- Cells -->
          <div
            v-for="cell in cells"
            :key="cell.date"
            class="heatmap-cell"
            :class="cellClass(cell.count)"
            :style="{ gridColumn: cell.col, gridRow: cell.row }"
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
import { buildDateOptions, resolveIntlLocale } from '@/i18n/helpers/format'

const { t, locale } = useI18n()

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
const isMobile = useMediaQuery('(max-width: 640px)')
const isTablet = useMediaQuery('(min-width: 641px) and (max-width: 900px)')

const DAY_MS = 86_400_000
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const VISIBLE_DAY_ROWS = new Set([1, 3, 5])

function parseUtcDate(iso) {
  return new Date(iso + 'T00:00:00Z')
}

function toIsoDate(date) {
  return date.toISOString().slice(0, 10)
}

function isValidIsoDate(value) {
  if (!ISO_DATE_PATTERN.test(value)) return false
  const parsed = parseUtcDate(value)
  return !Number.isNaN(parsed.getTime()) && toIsoDate(parsed) === value
}

function shiftUtcMonths(date, amount) {
  const targetMonth = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + amount, 1))
  const lastDay = new Date(
    Date.UTC(targetMonth.getUTCFullYear(), targetMonth.getUTCMonth() + 1, 0),
  ).getUTCDate()
  targetMonth.setUTCDate(Math.min(date.getUTCDate(), lastDay))
  return targetMonth
}

const intlLocale = computed(() => resolveIntlLocale(locale.value, 'en-US'))

// Keep the requested amount of history small enough to fit without
// horizontal scrolling. Desktop retains the complete server range.
const visibleMonthCount = computed(() => {
  if (isMobile.value) return 3
  if (isTablet.value) return 6
  return null
})

const sortedDays = computed(() => {
  if (!props.data?.days?.length) return []
  const byDate = new Map()

  for (const day of props.data.days) {
    if (!day || !isValidIsoDate(day.date)) continue
    const parsedCount = Number(day.count)
    byDate.set(day.date, {
      date: day.date,
      count: Number.isFinite(parsedCount) ? Math.max(0, parsedCount) : 0,
    })
  }

  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date))
})

const displayedDays = computed(() => {
  const source = sortedDays.value
  if (!source.length) return []

  const counts = new Map(source.map((day) => [day.date, day.count]))
  const availableStart = parseUtcDate(source[0].date)
  const end = parseUtcDate(source[source.length - 1].date)
  const months = visibleMonthCount.value
  const requestedStart = months ? shiftUtcMonths(end, -months) : availableStart
  const start = requestedStart > availableStart ? requestedStart : availableStart
  const days = []

  // Generate a continuous calendar window. This prevents an omitted API
  // date from shifting every later cell into the wrong weekday row.
  for (let cursor = start.getTime(); cursor <= end.getTime(); cursor += DAY_MS) {
    const date = toIsoDate(new Date(cursor))
    days.push({ date, count: counts.get(date) ?? 0 })
  }

  return days
})

const startDayOfWeek = computed(() => {
  const first = displayedDays.value[0]
  return first ? parseUtcDate(first.date).getUTCDay() : 0
})

const cells = computed(() => {
  return displayedDays.value.map((day, index) => {
    const offset = startDayOfWeek.value + index
    return {
      ...day,
      col: Math.floor(offset / 7) + 2,
      row: (offset % 7) + 1,
    }
  })
})

const totalWeeks = computed(() =>
  Math.ceil((startDayOfWeek.value + displayedDays.value.length) / 7),
)

// Column template used by both the month row and the week grid.
// Column 1 is a fixed 24 px spacer matching the day-of-week label
// column; columns 2..N+1 are fixed 11 px cells (matching
// `.heatmap-cell`'s width).
//
// Fixed widths — rather than `1fr` — keep the grid and its month labels
// aligned. Responsive date-window limits keep that fixed width inside
// the card without shrinking cells or introducing a scrollbar.
const columnTemplate = computed(() => `24px repeat(${totalWeeks.value}, 11px)`)

const monthsStyle = computed(() => ({
  gridTemplateColumns: columnTemplate.value,
}))

const gridStyle = computed(() => ({
  gridTemplateColumns: columnTemplate.value,
  gridTemplateRows: 'repeat(7, 11px)',
}))

// ── Month labels ────────────────────────────────────────────────────
const monthLabels = computed(() => {
  const days = displayedDays.value
  if (!days.length) return []

  const monthFmt = new Intl.DateTimeFormat(
    intlLocale.value,
    buildDateOptions(intlLocale.value, { month: 'short', timeZone: 'UTC' }),
  )

  const labels = []
  let lastMonthKey = ''
  for (let i = 0; i < days.length; i++) {
    const d = parseUtcDate(days[i].date)
    const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}`
    if (key === lastMonthKey) continue

    lastMonthKey = key
    const col = Math.floor((i + startDayOfWeek.value) / 7) + 2
    const label = { key, col, text: monthFmt.format(d) }

    // A range can begin in the last few days of a month. In that case
    // its label would collide with the next month's label, so prefer the
    // complete month rather than painting two names over one another.
    if (labels.length && col - labels[labels.length - 1].col < 3) {
      labels[labels.length - 1] = label
    } else {
      labels.push(label)
    }
  }

  return labels.map((label, index) => ({
    ...label,
    span: Math.max(1, (labels[index + 1]?.col ?? totalWeeks.value + 2) - label.col),
  }))
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
  const fmt = new Intl.DateTimeFormat(
    intlLocale.value,
    buildDateOptions(intlLocale.value, { weekday: 'narrow', timeZone: 'UTC' }),
  )
  return Array.from({ length: 7 }, (_, i) => ({
    key: i,
    text: fmt.format(new Date(sundayUtc + i * DAY_MS)),
  }))
})

function showDayLabel(i) {
  return VISIBLE_DAY_ROWS.has(i)
}

const visibleStats = computed(() => ({
  totalQuestions: displayedDays.value.reduce((sum, day) => sum + day.count, 0),
  activeDays: displayedDays.value.filter((day) => day.count > 0).length,
  maxDaily: Math.max(0, ...displayedDays.value.map((day) => day.count)),
}))

const visibleRangeLabel = computed(() => {
  const days = displayedDays.value
  if (!days.length) return ''
  const fmt = new Intl.DateTimeFormat(
    intlLocale.value,
    buildDateOptions(intlLocale.value, {
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    }),
  )
  return `${fmt.format(parseUtcDate(days[0].date))} – ${fmt.format(parseUtcDate(days[days.length - 1].date))}`
})

// ── Cell styling ────────────────────────────────────────────────────
function cellClass(count) {
  if (count === 0) return 'heatmap-cell--0'
  const max = visibleStats.value.maxDaily || 1
  const ratio = count / max
  if (ratio <= 0.25) return 'heatmap-cell--1'
  if (ratio <= 0.5) return 'heatmap-cell--2'
  if (ratio <= 0.75) return 'heatmap-cell--3'
  return 'heatmap-cell--4'
}

function cellTooltip(cell) {
  const dateFmt = new Intl.DateTimeFormat(
    intlLocale.value,
    buildDateOptions(intlLocale.value, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    }),
  )
  const date = dateFmt.format(parseUtcDate(cell.date))
  if (cell.count === 0) {
    return `${date}: ${t('dashboard.heatmapNoActivity')}`
  }
  return `${date}: ${t('dashboard.heatmapQuestions', { count: cell.count })}`
}
</script>

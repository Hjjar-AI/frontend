<!-- frontend/src/components/common/TimeAgo.vue -->
<template>
  <span class="time-ago" :title="fullDate">{{ relative }}</span>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { formatDate } from '@/utils/formatters'

const { t } = useI18n()

const props = defineProps({
  date: { type: [String, Date], required: true },
  // How often the displayed string is allowed to go stale, in
  // milliseconds. Set to 0 to disable the ticker entirely (useful
  // for static renders like PDF exports or archived views).
  //
  // The 30 s default was chosen to match the auto-refresh cadence
  // used by the admin Active Users page, which is the primary
  // consumer. A shorter value gives finer granularity at the cost
  // of more frequent recomputation; a longer one makes the string
  // visibly stale on shorter relative-time thresholds ("X seconds
  // ago" is meaningless if the display only updates every minute).
  tickMs: { type: Number, default: 30000 },
})

const fullDate = computed(() => {
  if (!props.date) return ''
  const d = new Date(props.date)
  if (isNaN(d.getTime())) return ''

  return formatDate(d, 'long')
})

const now = ref(Date.now())
let tickInterval = null

onMounted(() => {
  if (props.tickMs > 0) {
    tickInterval = setInterval(() => {
      now.value = Date.now()
    }, props.tickMs)
  }
})

onUnmounted(() => {
  if (tickInterval) {
    clearInterval(tickInterval)
    tickInterval = null
  }
})

const relative = computed(() => {
  if (!props.date) return '—'
  const d = new Date(props.date)
  if (isNaN(d.getTime())) return '—'
  const seconds = Math.floor((now.value - d.getTime()) / 1000)

  if (seconds < 10) return t('time.justNow')
  if (seconds < 60) return t('time.secondsAgo', { n: seconds })

  const mins = Math.floor(seconds / 60)
  if (mins < 60) return t('time.minutesAgo', { n: mins })

  const hours = Math.floor(mins / 60)
  if (hours < 24) return t('time.hoursAgo', { n: hours })

  const days = Math.floor(hours / 24)
  if (days < 30) return t('time.daysAgo', { n: days })

  const months = Math.floor(days / 30)
  if (months < 12) return t('time.monthsAgo', { n: months })

  const years = Math.floor(months / 12)
  return t('time.yearsAgo', { n: years })
})
</script>
<!-- frontend/src/components/charts/ChartCard.vue -->
<template>
  <BaseCard class="chart-card">
    <div class="chart-card__header">
      <h4 class="chart-card__title">{{ title }}</h4>
      <BaseIconButton
        v-if="allowExport"
        class="no-print"
        icon="bi bi-download"
        :label="t('ui.exportAsPng')"
        @click="exportImage"
      />
    </div>
    <div class="chart-card__body">
      <canvas ref="chartCanvas" :width="width" :height="height"></canvas>
    </div>
  </BaseCard>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import Chart from 'chart.js/auto'
import { useTheme } from '@/composables/useTheme'
import { useNotify } from '@/composables/useNotify'
import { useChartPalette } from '@/composables/useChartPalette'
import { getChartPalette } from '@/utils/chartPalette'
import { downloadUrl } from '@/utils/downloadFile'
import BaseIconButton from '@/components/base/BaseIconButton.vue'

const { t } = useI18n()

const props = defineProps({
  title: { type: String, required: true },
  type: {
    type: String,
    default: 'bar',
    validator: (v) => ['bar', 'line', 'pie', 'doughnut'].includes(v),
  },
  data: { type: Object, required: true },
  options: { type: Object, default: () => ({}) },
  width: { type: Number, default: 600 },
  height: { type: Number, default: 300 },
  allowExport: { type: Boolean, default: true },
})

const chartCanvas = ref(null)
const { currentTheme } = useTheme()
const { notify } = useNotify()
const { palette, refreshPalette } = useChartPalette()

let chartInstance = null
let observer = null
const isVisible = ref(false)

function mergeChartOptions(base, override) {
  const out = { ...base, ...override }

  if (base.plugins || override.plugins) {
    const bPlugins = base.plugins || {}
    const oPlugins = override.plugins || {}
    const bLegend = bPlugins.legend || {}
    const oLegend = oPlugins.legend || {}
    out.plugins = {
      ...bPlugins,
      ...oPlugins,
      legend: {
        ...bLegend,
        ...oLegend,
        labels: {
          ...(bLegend.labels || {}),
          ...(oLegend.labels || {}),
        },
      },
    }
  }

  if (base.scales || override.scales) {
    const bScales = base.scales || {}
    const oScales = override.scales || {}
    const axes = new Set([...Object.keys(bScales), ...Object.keys(oScales)])
    const mergedScales = { ...bScales }
    for (const axis of axes) {
      const bAxis = bScales[axis] || {}
      const oAxis = oScales[axis] || {}
      mergedScales[axis] = {
        ...bAxis,
        ...oAxis,
        ticks: {
          ...(bAxis.ticks || {}),
          ...(oAxis.ticks || {}),
        },
      }
    }
    out.scales = mergedScales
  }

  return out
}

function renderChart() {
  if (!chartCanvas.value) return

  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }

  const ctx = chartCanvas.value.getContext('2d')

  // Deep-clone the data so Chart.js mutations don't leak back to the
  // caller. structuredClone is preferred; JSON fallback for older
  // environments.
  let chartData
  try {
    chartData = structuredClone(props.data)
  } catch {
    chartData = JSON.parse(JSON.stringify(props.data))
  }

  if (chartData.datasets) {
    chartData.datasets.forEach((ds, i) => {
      if (!ds.backgroundColor) ds.backgroundColor = palette.value[i % palette.value.length]
      if (!ds.borderColor) ds.borderColor = palette.value[i % palette.value.length]
    })
  }

  const tokens = getChartPalette()
  const textColor = tokens.text || tokens.primary
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: textColor,
        },
      },
    },
    scales:
      props.type === 'bar' || props.type === 'line'
        ? {
            x: { ticks: { color: textColor } },
            y: { ticks: { color: textColor } },
          }
        : undefined,
  }

  const mergedOptions = mergeChartOptions(defaultOptions, props.options)

  chartInstance = new Chart(ctx, {
    type: props.type,
    data: chartData,
    options: mergedOptions,
  })
}

function exportImage() {
  if (!chartCanvas.value) return
  downloadUrl(chartCanvas.value.toDataURL('image/png'), `${props.title.replace(/\s+/g, '_')}.png`)
  notify(t('notifications.chartExported'), 'success')
}

function prepareForPrint() {
  // A chart below the viewport may not have crossed the lazy-render
  // observer yet. Render it synchronously before the browser captures
  // the print preview, then let Chart.js fit the print-sized container.
  refreshPalette()
  renderChart()
  chartInstance?.resize()
}

function restoreAfterPrint() {
  refreshPalette()
  if (isVisible.value) nextTick(renderChart)
}

watch(currentTheme, () => {
  refreshPalette()
  if (isVisible.value) {
    nextTick(renderChart)
  }
})

watch(
  () => props.data,
  () => {
    if (isVisible.value) {
      nextTick(renderChart)
    }
  },
  { deep: true },
)

onMounted(() => {
  window.addEventListener('beforeprint', prepareForPrint)
  window.addEventListener('afterprint', restoreAfterPrint)

  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          isVisible.value = true
          nextTick(renderChart)
          observer.disconnect()
        }
      }
    },
    { threshold: 0.1 },
  )

  if (chartCanvas.value) {
    observer.observe(chartCanvas.value)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeprint', prepareForPrint)
  window.removeEventListener('afterprint', restoreAfterPrint)

  if (observer) {
    observer.disconnect()
    observer = null
  }
  if (chartInstance) {
    chartInstance.destroy()
    chartInstance = null
  }
})
</script>

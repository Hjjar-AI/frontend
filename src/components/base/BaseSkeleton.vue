<!-- frontend/src/components/base/BaseSkeleton.vue -->
<template>
  <div
    v-if="show"
    :class="stacked ? 'base-skeleton-stack' : 'base-skeleton'"
    :style="stacked ? { '--skeleton-gap': gap } : null"
    aria-busy="true"
  >
    <template v-if="card">
      <div class="base-skeleton__card" v-for="i in count" :key="i">
        <div class="base-skeleton__avatar"></div>
        <div class="base-skeleton__lines">
          <div class="base-skeleton__line base-skeleton__line--wide"></div>
          <div class="base-skeleton__line base-skeleton__line--narrow"></div>
        </div>
      </div>
    </template>
    <template v-else>
      <div
        v-for="i in count"
        :key="i"
        class="base-skeleton__line"
        :style="lineStyle(i)"
      ></div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  width: { type: String, default: '100%' },
  height: { type: String, default: '20px' },
  count: { type: Number, default: 1 },
  gap: { type: String, default: 'var(--space-sm)' },
  stacked: { type: Boolean, default: false },
  card: { type: Boolean, default: false },
  minDisplay: { type: Number, default: 300 },
})

const show = ref(false)
let timer = null

onMounted(() => {
  timer = setTimeout(() => { show.value = true }, props.minDisplay)
})

onBeforeUnmount(() => {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
})

function lineStyle(idx) {
  const w = idx === props.count && props.count > 1 ? '60%' : props.width
  return { width: w, height: props.height, marginBottom: idx < props.count ? props.gap : '0' }
}
</script>
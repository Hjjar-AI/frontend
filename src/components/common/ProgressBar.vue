<!-- frontend/src/components/common/ProgressBar.vue -->
<template>
  <div class="progress-bar">
    <div
      class="progress-bar__track"
      role="progressbar"
      :aria-valuenow="progress"
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <div
        class="progress-bar__fill"
        :class="{ 'progress-bar__fill--flash': isFlashing }"
        :style="{ width: progress + '%' }"
      ></div>
      <div class="progress-bar__milestones">
        <!-- `insetInlineStart` (not `left`) so the 25/50/75/100 markers
             grow from the same edge as `.progress-bar__fill`, which is
             the inline-start edge — physical right in RTL (the app's
             default). A physical `left` places the markers 25/50/75/100
             from the physical left, which is the mirror of where the
             fill actually reaches. -->
        <span
          v-for="m in [25, 50, 75, 100]"
          :key="m"
          class="progress-bar__milestone"
          :class="{ 'progress-bar__milestone--reached': progress >= m }"
          :style="{ insetInlineStart: m + '%' }"
        ></span>
      </div>
    </div>
    <span class="progress-bar__label">{{ label || `${progress.toFixed(0)}%` }}</span>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useDebounceFn } from '@/composables/useDebounceFn'

const props = defineProps({
  progress: { type: Number, required: true, validator: (v) => v >= 0 && v <= 100 },
  label: { type: String, default: '' },
})

const isFlashing = ref(false)

const { debounced: endFlash } = useDebounceFn(() => {
  isFlashing.value = false
}, 600)

watch(() => props.progress, (newVal, oldVal) => {
  if (oldVal === undefined || newVal <= oldVal) return

  const oldMilestones = Math.floor(oldVal / 25)
  const newMilestones = Math.floor(newVal / 25)

  if (newMilestones > oldMilestones || (newVal === 100 && oldVal < 100)) {
    isFlashing.value = true
    endFlash()
  }
})
</script>
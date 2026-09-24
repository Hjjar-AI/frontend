<!-- frontend/src/components/common/ErrorBanner.vue -->
<template>
  <Transition name="error-banner">
    <div v-if="error" class="error-banner" role="alert">
      <span class="error-banner__text">{{ error }}</span>
      <div class="error-banner__actions">
        <BaseButton v-if="retry" variant="ghost" size="small" @click="$emit('retry')">
          <i class="bi bi-arrow-repeat"></i> {{ t('common.retry') }}
        </BaseButton>
        <BaseIconButton
          icon="bi bi-x"
          size="small"
          :label="t('ui.dismiss')"
          @click="$emit('dismiss')"
        />
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { onMounted, onBeforeUnmount, watch } from 'vue'
import BaseIconButton from '@/components/base/BaseIconButton.vue'

const { t } = useI18n()

const props = defineProps({
  error: { type: String, default: '' },
  retry: { type: Boolean, default: false },
  autoDismiss: { type: Boolean, default: false },
  autoDismissTimeout: { type: Number, default: 5000 },
})

const emit = defineEmits(['dismiss', 'retry'])

let timer = null

function startTimer() {
  if (props.autoDismiss && props.error) {
    timer = setTimeout(() => {
      emit('dismiss')
    }, props.autoDismissTimeout)
  }
}

function clearTimer() {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
}

watch(() => props.error, (newVal) => {
  clearTimer()
  if (newVal) {
    startTimer()
  }
})

onMounted(() => {
  startTimer()
})

onBeforeUnmount(() => {
  clearTimer()
})
</script>

<!-- frontend/src/components/common/ErrorBanner.vue -->
<template>
  <Transition name="error-banner">
    <div v-if="error" class="error-banner" role="alert">
      <span class="error-banner__text">{{ error }}</span>
      <div class="error-banner__actions">
        <BaseButton v-if="retry" variant="danger" size="small" @click="$emit('retry')">
          <i class="bi bi-arrow-repeat"></i> {{ t('common.retry') }}
        </BaseButton>
        <button
          class="btn-icon btn-icon--compact"
          @click="$emit('dismiss')"
          :aria-label="t('ui.dismiss')"
        >
          <i class="bi bi-x"></i>
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { onMounted, onBeforeUnmount, watch } from 'vue'

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
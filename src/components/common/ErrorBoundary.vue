<!-- frontend/src/components/common/ErrorBoundary.vue -->
<template>
  <slot v-if="!hasError" />
  <div v-else class="error-boundary">
    <div class="error-boundary__content">
      <i class="bi bi-exclamation-triangle error-boundary__icon"></i>
      <h3 class="error-boundary__title">{{ t('errors.boundaryTitle') }}</h3>
      <p class="error-boundary__message">{{ t('errors.boundaryMessage') }}</p>
      <div class="error-boundary__actions">
        <BaseButton variant="primary" @click="retry">
          <i class="bi bi-arrow-repeat"></i> {{ t('common.retry') }}
        </BaseButton>
        <BaseButton variant="secondary" @click="goHome">
          <i class="bi bi-house"></i> {{ t('errors.backHome') }}
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onErrorCaptured } from 'vue'
import { useRouter } from 'vue-router'
import BaseButton from '@/components/base/BaseButton.vue'

const { t } = useI18n()
const router = useRouter()
const hasError = ref(false)
const error = ref(null)

onErrorCaptured((err) => {
  hasError.value = true
  error.value = err
  console.error('ErrorBoundary caught:', err)
  return false
})

function retry() {
  hasError.value = false
  error.value = null
}

function goHome() {
  hasError.value = false
  error.value = null
  router.push('/')
}
</script>
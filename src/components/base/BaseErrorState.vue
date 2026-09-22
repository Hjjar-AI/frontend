<!-- frontend/src/components/base/BaseErrorState.vue -->
<template>
  <div class="base-error-state">
    <i class="bi bi-exclamation-triangle"></i>
    <h4>{{ title || t('errors.dataLoadFailed') }}</h4>
    <p class="text-muted">{{ message || t('common.unexpectedError') }}</p>
    <BaseButton v-if="retry" variant="primary" @click="$emit('retry')">
      <i class="bi bi-arrow-repeat"></i> {{ t('common.retry') }}
    </BaseButton>
  </div>
</template>

<script setup>
import BaseButton from '@/components/base/BaseButton.vue'

const { t } = useI18n()

defineProps({
  title: { type: String, default: '' },
  message: { type: String, default: '' },
  retry: { type: Boolean, default: false },
})

defineEmits(['retry'])
</script>
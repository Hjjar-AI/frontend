<!-- frontend/src/components/common/ToastContainer.vue -->
<template>
  <div
    class="toast-container no-print"
    :aria-label="t('a11y.notifications')"
    aria-live="polite"
    aria-atomic="true"
  >
    <TransitionGroup name="toast">
      <div
        v-for="toast in toastStore.toasts"
        :key="toast.id"
        class="toast"
        :class="`toast--${toast.type}`"
        role="alert"
      >
        <i class="toast__icon" :class="getToastIcon(toast.type)"></i>
        <span class="toast__message">{{ toast.message }}</span>
        <button
          class="btn-icon btn-icon--compact toast__close"
          @click="toastStore.removeToast(toast.id)"
          :aria-label="t('a11y.closeNotification')"
        >
          <i class="bi bi-x-lg"></i>
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { useToastStore } from '@/stores/toastStore'

const { t } = useI18n()
const toastStore = useToastStore()

function getToastIcon(type) {
  const icons = {
    success: 'bi bi-check-circle-fill',
    error: 'bi bi-exclamation-circle-fill',
    warning: 'bi bi-exclamation-triangle-fill',
    info: 'bi bi-info-circle-fill',
  }
  return icons[type] || icons.info
}
</script>
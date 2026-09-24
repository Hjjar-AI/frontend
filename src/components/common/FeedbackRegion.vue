<template>
  <div v-if="activeMessage" class="feedback-region" :class="`feedback-region--${scope}`">
    <ErrorBanner
      v-if="activeVariant === 'danger'"
      :error="activeMessage"
      :retry="retry"
      @retry="$emit('retry')"
      @dismiss="$emit('dismiss')"
    />
    <AlertBox v-else :variant="activeVariant" :message="activeMessage" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import AlertBox from './AlertBox.vue'
import ErrorBanner from './ErrorBanner.vue'

const props = defineProps({
  error: { type: String, default: '' },
  warning: { type: String, default: '' },
  success: { type: String, default: '' },
  info: { type: String, default: '' },
  retry: { type: Boolean, default: false },
  scope: { type: String, default: 'page', validator: (value) => ['page', 'section'].includes(value) },
})

defineEmits(['dismiss', 'retry'])

const activeFeedback = computed(() => {
  if (props.error) return { variant: 'danger', message: props.error }
  if (props.warning) return { variant: 'warning', message: props.warning }
  if (props.success) return { variant: 'success', message: props.success }
  if (props.info) return { variant: 'info', message: props.info }
  return { variant: 'info', message: '' }
})
const activeMessage = computed(() => activeFeedback.value.message)
const activeVariant = computed(() => activeFeedback.value.variant)
</script>

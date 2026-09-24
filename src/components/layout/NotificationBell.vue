<!-- frontend/src/components/layout/NotificationBell.vue -->
<template>
  <BaseIconButton
    class="notification-bell"
    icon="bi bi-bell"
    :label="t('a11y.notifications')"
    @click="$emit('click')"
  >
    <template #badge>
      <span v-if="count > 0" class="notification-bell__badge">{{ count > 9 ? '9+' : count }}</span>
    </template>
  </BaseIconButton>
</template>

<script setup>
import BaseIconButton from '@/components/base/BaseIconButton.vue'

const { t } = useI18n()

defineProps({
  count: { type: Number, default: 0 },
})
defineEmits(['click'])
</script>

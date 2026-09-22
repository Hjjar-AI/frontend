<!-- frontend/src/components/layout/NotificationBell.vue -->
<template>
  <button
    class="notification-bell"
    :aria-label="t('a11y.notifications')"
    @click="$emit('click')"
    @keydown.enter="$emit('click')"
    @keydown.space.prevent="$emit('click')"
  >
    <i class="bi bi-bell"></i>
    <span v-if="count > 0" class="notification-bell__badge">{{ count > 9 ? '9+' : count }}</span>
  </button>
</template>

<script setup>
const { t } = useI18n()

defineProps({
  count: { type: Number, default: 0 },
})
defineEmits(['click'])
</script>
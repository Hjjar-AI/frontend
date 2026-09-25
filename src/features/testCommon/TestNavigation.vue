<template>
  <div class="nav-buttons">
    <BaseButton
      v-if="showPause"
      class="test-navigation__pause"
      variant="secondary"
      icon="bi bi-pause-circle"
      :disabled="disabled"
      @click="$emit('pause')"
    >
      {{ t('tests.pause') }}
    </BaseButton>
    <BaseButton v-if="current > 0" variant="secondary" :disabled="disabled" @click="$emit('previous')">{{ t('tests.previous') }}</BaseButton>
    <BaseButton v-if="current < total - 1" variant="primary" :disabled="disabled" @click="$emit('next')">{{ t('tests.next') }}</BaseButton>
    <BaseButton v-else variant="primary" :disabled="disabled" :loading="loading" @click="$emit('finish')">{{ t('tests.finish') }}</BaseButton>
  </div>
</template>

<script setup>

const { t } = useI18n()

defineProps({
  current: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  showPause: { type: Boolean, default: false },
})
defineEmits(['previous', 'next', 'finish', 'pause'])
</script>

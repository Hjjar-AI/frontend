<template>
  <div class="nav-buttons">
    <BaseButton v-if="current > 0" variant="secondary" :disabled="disabled" @click="$emit('previous')">{{ t('tests.previous') }}</BaseButton>
    <BaseButton v-if="current < total - 1" variant="primary" :disabled="disabled" @click="$emit('next')">{{ t('tests.next') }}</BaseButton>
    <BaseButton v-else variant="primary" :disabled="disabled" :loading="loading" @click="$emit('finish')">{{ t('tests.finish') }}</BaseButton>
  </div>
</template>

<script setup>

const { t } = useI18n()

defineProps({ current: Number, total: Number, loading: Boolean, disabled: Boolean })
defineEmits(['previous', 'next', 'finish'])
</script>

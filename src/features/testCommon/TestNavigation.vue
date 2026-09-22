<template>
  <div class="nav-buttons">
    <BaseButton v-if="current > 0" variant="secondary" @click="$emit('previous')">{{ t('tests.previous') }}</BaseButton>
    <BaseButton v-if="current < total - 1" variant="primary" @click="$emit('next')">{{ t('tests.next') }}</BaseButton>
    <BaseButton v-else variant="success" :loading="loading" @click="$emit('finish')">{{ t('tests.finish') }}</BaseButton>
  </div>
</template>

<script setup>

const { t } = useI18n()

defineProps({ current: Number, total: Number, loading: Boolean })
defineEmits(['previous', 'next', 'finish'])
</script>
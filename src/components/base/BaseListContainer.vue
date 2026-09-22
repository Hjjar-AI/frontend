<!-- frontend/src/components/base/BaseListContainer.vue -->
<template>
  <div class="base-list-container" :aria-busy="loading ? 'true' : 'false'">
    <div v-if="loading">
      <BaseSkeleton :count="skeletonCount" :height="skeletonHeight" stacked />
    </div>

    <BaseErrorState
      v-else-if="error && items.length === 0"
      :message="error"
      retry
      @retry="$emit('retry')"
    />

    <BaseEmptyState
      v-else-if="items.length === 0"
      :title="emptyTitle"
      :message="emptyMessage"
      :icon="emptyIcon"
    >
      <template #actions v-if="$slots.emptyActions">
        <slot name="emptyActions" />
      </template>
    </BaseEmptyState>

    <div v-else class="base-list-container__content">
      <div v-if="error" class="base-list-container__inline-error" role="alert">
        <i class="bi bi-exclamation-triangle"></i>
        <span>{{ error }}</span>
        <button
          class="btn-icon btn-icon--compact"
          @click="$emit('retry')"
          :aria-label="t('common.retry')"
        >
          <i class="bi bi-arrow-repeat"></i>
        </button>
      </div>
      <slot :items="items" />
    </div>
  </div>
</template>

<script setup>
import BaseSkeleton from '@/components/base/BaseSkeleton.vue'
import BaseErrorState from '@/components/base/BaseErrorState.vue'
import BaseEmptyState from '@/components/base/BaseEmptyState.vue'

const { t } = useI18n()

defineProps({
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  items: { type: Array, required: true },
  emptyTitle: { type: String, default: '' },
  emptyMessage: { type: String, default: '' },
  emptyIcon: { type: String, default: 'bi-inbox' },
  skeletonCount: { type: Number, default: 3 },
  skeletonHeight: { type: String, default: '120px' },
})

defineEmits(['retry'])
</script>
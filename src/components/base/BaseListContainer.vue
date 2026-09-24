<!-- frontend/src/components/base/BaseListContainer.vue -->
<template>
  <div class="base-list-container" :aria-busy="loading ? 'true' : 'false'">
    <AsyncContent
      :loading="loading"
      :error="items.length === 0 ? error : ''"
      :empty="items.length === 0"
      :empty-title="emptyTitle"
      :empty-message="emptyMessage"
      :empty-icon="emptyIcon"
      :skeleton-count="skeletonCount"
      :skeleton-height="skeletonHeight"
      @retry="$emit('retry')"
    >
      <template v-if="$slots.emptyActions" #emptyActions>
        <slot name="emptyActions" />
      </template>
      <div class="base-list-container__content">
        <div v-if="error" class="base-list-container__inline-error" role="alert">
          <i class="bi bi-exclamation-triangle"></i>
          <span>{{ error }}</span>
          <BaseIconButton
            icon="bi bi-arrow-repeat"
            size="small"
            :label="t('common.retry')"
            @click="$emit('retry')"
          />
        </div>
        <slot :items="items" />
      </div>
    </AsyncContent>
  </div>
</template>

<script setup>
import AsyncContent from '@/components/common/AsyncContent.vue'
import BaseIconButton from '@/components/base/BaseIconButton.vue'

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

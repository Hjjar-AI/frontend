<template>
  <div class="async-content" :aria-busy="loading ? 'true' : 'false'">
    <slot v-if="loading" name="loading">
      <BaseSkeleton :count="skeletonCount" :height="skeletonHeight" stacked />
    </slot>
    <slot v-else-if="error" name="error" :error="error" :retry="retry">
      <BaseErrorState :message="error" retry @retry="retry" />
    </slot>
    <slot v-else-if="empty" name="empty">
      <BaseEmptyState :title="emptyTitle" :message="emptyMessage" :icon="emptyIcon" :reason="emptyReason">
        <template v-if="$slots.emptyActions" #actions><slot name="emptyActions" /></template>
      </BaseEmptyState>
    </slot>
    <slot v-else />
  </div>
</template>

<script setup>
import BaseSkeleton from '@/components/base/BaseSkeleton.vue'
import BaseErrorState from '@/components/base/BaseErrorState.vue'
import BaseEmptyState from '@/components/base/BaseEmptyState.vue'

defineProps({
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
  empty: { type: Boolean, default: false },
  emptyTitle: { type: String, default: '' },
  emptyMessage: { type: String, default: '' },
  emptyIcon: { type: String, default: '' },
  emptyReason: { type: String, default: 'generic' },
  skeletonCount: { type: Number, default: 3 },
  skeletonHeight: { type: String, default: '120px' },
})

const emit = defineEmits(['retry'])
const retry = () => emit('retry')
</script>

<!-- frontend/src/components/common/ModerationCard.vue -->
<template>
  
  <BaseCard class="moderation-card" :variant="variant">
    <div class="moderation-card__header">
      <div class="moderation-card__title">
        <div v-if="icon" class="icon-hero icon-hero--sm">
          <i :class="icon"></i>
        </div>
        <div>
          <span class="moderation-card__label">{{ label }}</span>
          <span v-if="subtitle" class="moderation-card__subtitle">{{ subtitle }}</span>
        </div>
      </div>
      <div class="moderation-card__actions">
        <slot name="actions" />
        <button v-if="showSelect" class="btn-icon" :class="{ 'btn-icon--active': selected }" @click="$emit('toggle-select')">
          <i :class="selected ? 'bi bi-check-square' : 'bi bi-square'"></i>
        </button>
      </div>
    </div>
    <div class="moderation-card__meta">
      <slot name="meta" />
    </div>
    <div v-if="$slots.body" class="moderation-card__body">
      <slot name="body" />
    </div>
  </BaseCard>
</template>

<script setup>
import BaseCard from '@/components/base/BaseCard.vue'

defineProps({
  icon: { type: String, default: '' },
  label: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  selected: { type: Boolean, default: false },
  showSelect: { type: Boolean, default: false },
  variant: {
    type: String,
    default: 'warning',
    validator: (v) => ['default', 'primary', 'info', 'danger', 'success', 'warning'].includes(v),
  },
})

defineEmits(['toggle-select'])
</script>


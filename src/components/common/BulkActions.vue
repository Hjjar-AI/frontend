<!-- frontend/src/components/common/BulkActions.vue -->
<template>
  <div class="bulk-actions">
    <span class="bulk-actions__count">
      <i class="bi bi-check-square"></i>
      {{ t('questions.bulkSelectedCount', { count, label: resolvedItemLabel }) }}
    </span>
    <div class="bulk-actions__buttons">
      <BaseButton
        variant="secondary"
        size="small"
        @click="$emit('verify')"
        :aria-label="resolvedVerifyLabel"
      >
        <i class="bi bi-patch-check"></i> {{ resolvedVerifyLabel }}
      </BaseButton>
      <BaseButton
        variant="secondary"
        size="small"
        @click="$emit('unverify')"
        :aria-label="resolvedUnverifyLabel"
      >
        <i class="bi bi-x-circle"></i> {{ resolvedUnverifyLabel }}
      </BaseButton>
      <slot name="extra-actions" />
      <BaseButton
        variant="secondary"
        size="small"
        @click="$emit('clear')"
        :aria-label="resolvedClearLabel"
      >
        <i class="bi bi-x-lg"></i> {{ resolvedClearLabel }}
      </BaseButton>
    </div>
  </div>
</template>

<script setup>

const { t } = useI18n()

const props = defineProps({
  count: { type: Number, required: true },
  itemLabel: { type: String },
  verifyLabel: { type: String },
  unverifyLabel: { type: String },
  clearLabel: { type: String },
})

defineEmits(['verify', 'unverify', 'clear'])

// `computed` is auto-imported via the 'vue' preset.
const resolvedItemLabel = computed(() => props.itemLabel ?? t('questions.itemLabelDefault'))
const resolvedVerifyLabel = computed(() => props.verifyLabel ?? t('questions.bulkVerify'))
const resolvedUnverifyLabel = computed(() => props.unverifyLabel ?? t('questions.bulkUnverify'))
const resolvedClearLabel = computed(() => props.clearLabel ?? t('questions.bulkClear'))
</script>

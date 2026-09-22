<!-- frontend/src/components/common/BulkTagEditor.vue -->
<template>
  <BaseModal
    :is-open="isOpen"
    :title="t('questions.bulkTags')"
    @update:is-open="$emit('close')"
  >
    <div class="bulk-tag-editor">
      <p class="text-muted">{{ t('questions.bulkTagsCount', { count }) }}</p>
      <BaseInput
        v-model="addTags"
        :label="t('questions.bulkTagsAdd')"
        :placeholder="t('questions.bulkTagsPlaceholderAdd')"
      />
      <BaseInput
        v-model="removeTags"
        :label="t('questions.bulkTagsRemove')"
        :placeholder="t('questions.bulkTagsPlaceholderRemove')"
      />
      <div class="form-actions">

        <BaseButton variant="primary" @click="apply" :loading="loading">{{ t('common.apply') }}</BaseButton>
        <BaseButton variant="secondary" @click="$emit('close')">{{ t('common.cancel') }}</BaseButton>
      </div>
    </div>
  </BaseModal>
</template>

<script setup>
import { ref, watch } from 'vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseButton from '@/components/base/BaseButton.vue'


const { t } = useI18n()

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  count: { type: Number, default: 0 },

  loading: { type: Boolean, default: false },
})

const emit = defineEmits(['apply', 'close'])

const addTags = ref('')
const removeTags = ref('')

watch(() => props.isOpen, (open) => {
  if (open) {
    addTags.value = ''
    removeTags.value = ''
  }
}, { immediate: true })

function apply() {
  emit('apply', {
    add: addTags.value.split(',').map(t => t.trim()).filter(Boolean),
    remove: removeTags.value.split(',').map(t => t.trim()).filter(Boolean),
  })
}
</script>
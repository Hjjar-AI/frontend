<template>
  <BaseInput
    :model-value="modelValue"
    type="search"
    :placeholder="placeholder"
    :aria-label="ariaLabel || t('common.search')"
    @update:model-value="handleInput"
    @enter="commit"
    @keydown.esc="clear"
  />
</template>

<script setup>
import BaseInput from '@/components/base/BaseInput.vue'
import { useDebounceFn } from '@/composables/useDebounceFn'
import { LIST_SEARCH_DEBOUNCE_MS } from '@/constants/layout'

const { t } = useI18n()
const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  ariaLabel: { type: String, default: '' },
  delay: { type: Number, default: LIST_SEARCH_DEBOUNCE_MS },
})
const emit = defineEmits(['update:modelValue', 'search'])
const { debounced, cancel } = useDebounceFn(() => emit('search'), props.delay)

function handleInput(value) {
  emit('update:modelValue', value)
  debounced()
}

function commit() {
  cancel()
  emit('search')
}

function clear() {
  cancel()
  emit('update:modelValue', '')
  emit('search')
}
</script>

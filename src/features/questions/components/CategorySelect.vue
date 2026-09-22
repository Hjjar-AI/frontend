<!-- frontend/src/features/questions/components/CategorySelect.vue -->
<template>
  <BaseSelect
    id="q-category"
    :label="t('questions.categoryLabel')"
    :model-value="modelValue ?? ''"
    :options="categoryOptions"
    :placeholder="t('questions.noCategory')"
    @update:model-value="$emit('update:modelValue', $event === '' ? null : Number($event))"
  />
</template>

<script setup>
import { computed, onMounted } from 'vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import { useCategoryStore } from '@/stores/categoryStore'
import { useRecentItems } from '@/composables/useRecentItems'


const { t } = useI18n()

defineProps({
  modelValue: [Number, String, null],
})
defineEmits(['update:modelValue'])

const categoryStore = useCategoryStore()
const { recentIds: recentCategoryIds } = useRecentItems('categories')

onMounted(() => {
  if (!categoryStore.hasItems) {
    categoryStore.fetchAll()
  }
})

const categories = computed(() => categoryStore.items)

const categoryOptions = computed(() => {
  const recent = recentCategoryIds.value
    .map(id => categories.value.find(c => c.id === id))
    .filter(Boolean)
    .map(c => ({ value: c.id, label: `${c.name} ${t('questions.recentSuffix')}` }))
  const others = categories.value
    .filter(c => !recentCategoryIds.value.includes(c.id))
    .map(c => ({ value: c.id, label: c.name }))
  return [...recent, ...others]
})
</script>
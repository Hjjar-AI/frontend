<!-- frontend/src/features/questions/components/FilterBar.vue -->
<template>
  <div class="filter-bar">
    <div class="filter-bar__top">
      <button
        type="button"
        class="btn-icon filter-bar__toggle"
        @click="collapsed = !collapsed"
        :aria-expanded="!collapsed"
        :aria-label="collapsed ? t('questions.filterShow') : t('questions.filterHideFull')"
      >
        <i :class="collapsed ? 'bi bi-funnel' : 'bi bi-funnel-fill'"></i>
        <span>{{ collapsed ? t('questions.filterShowShort') : t('questions.filterHide') }}</span>
        <span v-if="activeFilterCount > 0 && collapsed" class="filter-bar__badge">{{ activeFilterCount }}</span>
      </button>
      <BaseButton v-if="activeFilterCount > 0" variant="secondary" size="small" @click="resetFilters">
        <i class="bi bi-arrow-counterclockwise"></i> {{ t('common.reset') }}
      </BaseButton>
    </div>

    <Transition name="filter-collapse">
      <div v-show="!collapsed" class="filter-bar__row">
        <div class="filter-bar__field">
          <BaseInput
            :model-value="filters.search"
            @update:model-value="onSearchInput"
            :placeholder="t('questions.searchPlaceholder')"
            :aria-label="t('common.search')"
          />
        </div>
        <div class="filter-bar__field">
          <BaseSelect
            :model-value="filters.category"
            @update:model-value="(val) => onFilterChange('category', val)"
            :options="categorySelectOptions"
            :placeholder="t('questions.filterAllCategories')"
          />
        </div>
        <div class="filter-bar__field">
          <DifficultySelector
            :model-value="filters.difficulty"
            @update:model-value="onFilterChange('difficulty', $event)"
          />
        </div>
        <div class="filter-bar__field filter-bar__field--switch">
          <BaseCheckbox
            :model-value="filters.verified === 'yes'"
            @update:model-value="(val) => onFilterChange('verified', val ? 'yes' : '')"
            :label="t('questions.filterVerifiedLabel')"
          />
        </div>
        <div class="filter-bar__field">
          <BaseSelect
            :model-value="filters.tag"
            @update:model-value="(val) => onFilterChange('tag', val)"
            :options="tagSelectOptions"
            :placeholder="t('questions.filterAllTags')"
          />
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRecentItems } from '@/composables/useRecentItems'
import { useDebounceFn } from '@/composables/useDebounceFn'
import DifficultySelector from './DifficultySelector.vue'
import BaseCheckbox from '@/components/base/BaseCheckbox.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'

const { t } = useI18n()

const props = defineProps({

  filters: {
    type: Object,
    default: () => ({
      search: '',
      category: '',
      difficulty: '',
      verified: '',
      tag: '',
    }),
  },
  categories: { type: Array, default: () => [] },
  tags: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:filters', 'search', 'reset'])

const collapsed = ref(
  typeof window !== 'undefined' &&
  window.matchMedia('(max-width: 768px)').matches
)

const { recentIds: recentCategoryIds } = useRecentItems('categories')
const { recentIds: recentTagIds } = useRecentItems('tags')

const categorySelectOptions = computed(() => {
  const recentSet = new Set(recentCategoryIds.value)
  const recent = recentCategoryIds.value
    .map(id => props.categories.find(c => c.id === id))
    .filter(Boolean)
    .map(c => ({ value: c.id, label: `${c.name} ${t('questions.recentSuffix')}` }))
  const others = props.categories
    .filter(c => !recentSet.has(c.id))
    .map(c => ({ value: c.id, label: c.name }))
  return [...recent, ...others]
})
const tagSelectOptions = computed(() => {
  const recentNames = recentTagIds.value.filter(Boolean)
  const recentSet = new Set(recentNames)
  const recent = recentNames.map(name => ({
    value: name,
    label: `${name} ${t('questions.recentSuffix')}`,
  }))
  const others = (props.tags || [])
    .map(tag => (typeof tag === 'string' ? tag : tag?.name))
    .filter(Boolean)
    .filter(name => !recentSet.has(name))
    .map(name => ({ value: name, label: name }))
  return [...recent, ...others]
})

const activeFilterCount = computed(() => {
  let count = 0
  if (props.filters.search) count++
  if (props.filters.category) count++
  if (props.filters.difficulty) count++
  if (props.filters.verified === 'yes') count++
  if (props.filters.tag) count++
  return count
})

const { debounced: debouncedSearch } = useDebounceFn(() => emit('search'), 400)

function onSearchInput(value) {
  emit('update:filters', { ...props.filters, search: value })
  debouncedSearch()
}

function onFilterChange(key, value) {
  emit('update:filters', { ...props.filters, [key]: value })
  emit('search')
}

function resetFilters() {
  emit('reset')
}
</script>

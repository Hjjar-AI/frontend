<!-- frontend/src/features/admin/components/ExportFilters.vue -->
<!--
  Filter panel for the flat question export.

  Three MULTI-SELECT checkbox grids — difficulty, categories, tags —
  plus a search field, a PDF title, and optional PDF front matter. Uses the same
  `SourceGridPicker` component the study setup uses for category
  selection, so the interaction (click the row to toggle, click again
  to unselect, "Clear" link in the section header) is identical
  across the two surfaces.

  DATA SHAPE (v-model)
  --------------------
      {
        title:        '',      // free text, PDF only
        include_about: false,  // PDF only
        about_title: '',
        about_body: '',
        about_fields: [],
        search:       '',
        difficulties: [],      // array of 'easy' | 'medium' | 'hard'
        category_ids: [],      // array of ints
        tags_filter:  [],      // array of tag-name strings
      }

  The title is NOT a filter — it does not narrow the queryset. It is
  a document label used by PDF export for the header banner and the
  generated filename. Excel, CSV, and JSON ignore it. The i18n hint
  below the field tells the admin this.

  The parent is responsible for serialising the panel state into
  query params — see DatabaseInfo.vue's `exportFilterParams` computed
  for the reference implementation.
-->
<template>
  <div class="export-filters">
    <div class="export-filters__header">
      <h4 class="export-filters__title">
        <i class="bi bi-funnel"></i>
        {{ t('admin.database.filtersTitle') }}
      </h4>
      <BaseButton
        v-if="hasActiveFilters"
        variant="ghost"
        size="small"
        icon="bi bi-x-circle"
        @click="clearAll"
      >{{ t('admin.database.filtersClear') }}</BaseButton>
    </div>

    <p class="export-filters__hint">{{ t('admin.database.filtersHint') }}</p>

    <!-- ── Export title (document label, not a filter) ─────────── -->
    <div class="export-filters__section">
      <BaseInput
        :model-value="modelValue.title"
        :label="t('admin.database.exportTitleLabel')"
        :placeholder="t('admin.database.exportTitlePlaceholder')"
        :hint="t('admin.database.exportTitleHint')"
        :maxlength="150"
        @update:model-value="update('title', $event)"
      />
    </div>

    <div class="export-filters__section export-filters__about">
      <BaseCheckbox
        :model-value="Boolean(modelValue.include_about)"
        :label="t('admin.database.includeAboutPage')"
        @update:model-value="update('include_about', $event)"
      />
      <p class="export-filters__field-hint">{{ t('admin.database.includeAboutPageHint') }}</p>

      <div v-if="modelValue.include_about" class="export-filters__about-fields">
        <BaseInput
          :model-value="modelValue.about_title"
          :label="t('admin.database.aboutPageTitle')"
          :placeholder="t('admin.database.aboutPageTitlePlaceholder')"
          :maxlength="150"
          @update:model-value="update('about_title', $event)"
        />

        <BaseTextarea
          id="pdf-about-body"
          :model-value="modelValue.about_body"
          :label="t('admin.database.aboutPageBody')"
          :placeholder="t('admin.database.aboutPageBodyPlaceholder')"
          :maxlength="3000"
          :rows="5"
          show-count
          @update:model-value="update('about_body', $event)"
        />

        <div class="export-filters__custom-header">
          <span>{{ t('admin.database.aboutCustomFields') }}</span>
          <BaseButton
            variant="secondary"
            size="small"
            :disabled="aboutFields.length >= 10"
            @click="addAboutField"
          >
            <i class="bi bi-plus-lg"></i>
            {{ t('admin.database.aboutAddField') }}
          </BaseButton>
        </div>

        <div
          v-for="(field, index) in aboutFields"
          :key="index"
          class="export-filters__custom-row"
        >
          <BaseInput
            :model-value="field.label"
            :placeholder="t('admin.database.aboutFieldLabel')"
            :aria-label="t('admin.database.aboutFieldLabel')"
            :maxlength="60"
            @update:model-value="updateAboutField(index, 'label', $event)"
          />
          <BaseInput
            :model-value="field.value"
            :placeholder="t('admin.database.aboutFieldValue')"
            :aria-label="t('admin.database.aboutFieldValue')"
            :maxlength="500"
            @update:model-value="updateAboutField(index, 'value', $event)"
          />
          <BaseIconButton
            variant="danger"
            size="small"
            icon="bi bi-trash"
            :label="t('admin.database.aboutRemoveField')"
            @click="removeAboutField(index)"
          />
        </div>
      </div>
    </div>

    <div class="export-filters__divider"></div>

    <!-- ── Search (single input, not a grid) ───────────────────── -->
    <div class="export-filters__section">
      <BaseInput
        :model-value="modelValue.search"
        :label="t('common.search')"
        :placeholder="t('questions.searchPlaceholder')"
        :hint="t('admin.database.filtersSearchHint')"
        @update:model-value="update('search', $event)"
      />
    </div>

    <!-- ── Difficulty (multi-select checkbox grid) ─────────────── -->
    <div class="export-filters__section">
      <SourceGridPicker
        :model-value="modelValue.difficulties"
        :items="difficultyItems"
        :multiple="true"
        :label="t('difficulty.label')"
        icon="bi bi-speedometer2"
        @update:model-value="update('difficulties', $event)"
      />
    </div>

    <!-- ── Categories (multi-select checkbox grid) ─────────────── -->
    <div class="export-filters__section">
      <SourceGridPicker
        :model-value="modelValue.category_ids"
        :items="categoryItems"
        :loading="categoriesLoading"
        :multiple="true"
        :label="t('questions.categoryLabel')"
        icon="bi bi-folder2"
        :empty-text="t('categories.empty')"
        @update:model-value="update('category_ids', $event)"
      />
    </div>

    <!-- ── Tags (multi-select checkbox grid) ───────────────────── -->
    <div class="export-filters__section">
      <SourceGridPicker
        :model-value="modelValue.tags_filter"
        :items="tagItems"
        :loading="tagsLoading"
        :multiple="true"
        :label="t('questions.tagsLabel')"
        icon="bi bi-tags"
        :empty-text="t('admin.tags.empty')"
        @update:model-value="update('tags_filter', $event)"
      />
    </div>

    <!-- ── Live summary line ───────────────────────────────────── -->
    <p v-if="activeSummary" class="export-filters__summary">
      <i class="bi bi-info-circle"></i>
      {{ activeSummary }}
    </p>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseTextarea from '@/components/base/BaseTextarea.vue'
import BaseCheckbox from '@/components/base/BaseCheckbox.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseIconButton from '@/components/base/BaseIconButton.vue'
import SourceGridPicker from '@/components/common/SourceGridPicker.vue'
import { useCategoryStore } from '@/stores/categoryStore'
import { useTagStore } from '@/stores/tagStore'

const { t } = useI18n()

const props = defineProps({
  modelValue: { type: Object, required: true },
})

const emit = defineEmits(['update:modelValue'])

const categoryStore = useCategoryStore()
const tagStore = useTagStore()

// ── Item arrays for the three pickers ──────────────────────────────

const difficultyItems = computed(() => [
  { value: 'easy', label: t('difficulty.easy'), color: 'var(--color-success)' },
  { value: 'medium', label: t('difficulty.medium'), color: 'var(--color-warning)' },
  { value: 'hard', label: t('difficulty.hard'), color: 'var(--color-danger)' },
])

const categoryItems = computed(() =>
  categoryStore.items.map((c) => ({
    value: c.id,
    label: c.name,
    color: c.color || undefined,
  })),
)

const tagItems = computed(() =>
  tagStore.items.map((tag) => ({
    value: typeof tag === 'string' ? tag : tag.name,
    label: typeof tag === 'string' ? tag : tag.name,
    count: typeof tag === 'string' ? undefined : tag.count,
  })),
)

const categoriesLoading = computed(() => categoryStore.isLoading)
const tagsLoading = computed(() => tagStore.isLoading)
const aboutFields = computed(() =>
  Array.isArray(props.modelValue.about_fields) ? props.modelValue.about_fields : [],
)

// ── Active-filter state ────────────────────────────────────────────
//
// The title counts toward `hasActiveFilters` so the "Clear filters"
// button appears once a title is typed. Clicking it resets the whole
// panel — including the title — which is what an admin expects from
// a "start over" action.

const hasActiveFilters = computed(() => {
  const v = props.modelValue
  return Boolean(
    v.title ||
    v.include_about ||
    v.search ||
    (v.difficulties && v.difficulties.length) ||
    (v.category_ids && v.category_ids.length) ||
    (v.tags_filter && v.tags_filter.length),
  )
})

// Human-readable summary of what is currently filtered. The title is
// intentionally NOT included — it is a document label, not a filter,
// and mixing it into "الفلاتر المطبقة" would be misleading.
const activeSummary = computed(() => {
  const v = props.modelValue
  const parts = []

  if (v.search) {
    parts.push(`${t('common.search')}: «${v.search}»`)
  }

  if (v.difficulties && v.difficulties.length) {
    const labels = v.difficulties
      .map((d) => {
        const key = {
          easy: 'difficulty.easy',
          medium: 'difficulty.medium',
          hard: 'difficulty.hard',
        }[d]
        return key ? t(key) : d
      })
      .join('، ')
    parts.push(`${t('difficulty.label')}: ${labels}`)
  }

  if (v.category_ids && v.category_ids.length) {
    const names = v.category_ids
      .map((id) => categoryStore.items.find((c) => c.id === id)?.name)
      .filter(Boolean)
      .join('، ')
    if (names) parts.push(`${t('questions.categoryLabel')}: ${names}`)
  }

  if (v.tags_filter && v.tags_filter.length) {
    parts.push(`${t('questions.tagsLabel')}: ${v.tags_filter.join('، ')}`)
  }

  if (!parts.length) return ''
  return t('admin.database.filtersActive', { parts: parts.join(' · ') })
})

// ── Mutation helpers ───────────────────────────────────────────────

function update(key, value) {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}

function addAboutField() {
  if (aboutFields.value.length >= 10) return
  update('about_fields', [...aboutFields.value, { label: '', value: '' }])
}

function updateAboutField(index, key, value) {
  const fields = aboutFields.value.map((field, current) =>
    current === index ? { ...field, [key]: value } : field,
  )
  update('about_fields', fields)
}

function removeAboutField(index) {
  update('about_fields', aboutFields.value.filter((_, current) => current !== index))
}

function clearAll() {
  emit('update:modelValue', {
    title: '',
    include_about: false,
    about_title: '',
    about_body: '',
    about_fields: [],
    search: '',
    difficulties: [],
    category_ids: [],
    tags_filter: [],
  })
}

// ── Bootstrap ──────────────────────────────────────────────────────

onMounted(async () => {
  if (!categoryStore.hasItems) {
    categoryStore.fetchAll()
  }

  if (tagStore.items.length === 0) await tagStore.fetchList()
})
</script>

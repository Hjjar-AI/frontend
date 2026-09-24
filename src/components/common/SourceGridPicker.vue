<!-- frontend/src/components/common/SourceGridPicker.vue -->
<!--
  Generic selectable grid of source items.

  Consumers pass `items` as { value, label, color?, icon?, count? }
  and get back either an array of values (multiple=true) or a single
  value (multiple=false).

  CONSOLIDATION NOTE
  ------------------
  `CategoryGridPicker.vue` (formerly at features/testCommon/) was a
  strict subset of this component's API — same markup, same
  check/select semantics, fewer features. It has been removed and its
  single caller (`UnifiedTestSetup.vue`) now maps its categories into
  `items` and uses this component with `:multiple="true"`.

  The `multiple=false` single-select mode is not used anywhere in the
  app after that consolidation, but is kept because it is a general
  API surface: the toggle handler below implements
  "click-to-select / click-again-to-deselect" for both shapes, and
  removing it would require re-adding it the first time a caller
  wants a radio-like picker. If a future cleanup decides it truly
  will never be used, the single-mode branches are:
    • the `else` branch of `toggle()`
    • the `--single` modifier in the grid styles
    • the `isSelected` single-value branch
-->
<template>
  <div class="source-grid-picker">
    <div class="source-grid-picker__header">
      <label class="source-grid-picker__label">
        <i v-if="icon" :class="icon"></i>
        {{ label }}
        <span v-if="optional" class="source-grid-picker__optional">
          {{ t('common.optional') }}
        </span>
      </label>
      <BaseButton
        v-if="showClear && hasSelection"
        variant="ghost"
        size="small"
        class="source-grid-picker__clear"
        @click="clear"
      >
        {{ t('common.clear') }}
      </BaseButton>
    </div>

    <div v-if="loading" class="source-grid-picker__loading">
      <BaseSkeleton :count="2" height="28px" stacked />
    </div>

    <div v-else-if="items.length === 0" class="source-grid-picker__empty">
      {{ emptyText }}
    </div>

    <div
      v-else
      class="source-grid-picker__grid"
      :class="{ 'source-grid-picker__grid--single': !multiple }"
    >
      <label
        v-for="item in items"
        :key="item.value"
        class="source-grid-picker__item"
        :class="{ 'source-grid-picker__item--selected': isSelected(item.value) }"
      >
        <input
          type="checkbox"
          class="source-grid-picker__input"
          :value="item.value"
          :checked="isSelected(item.value)"
          @change="toggle(item.value)"
        />
        <span class="source-grid-picker__check" aria-hidden="true">
          <i class="bi bi-check-lg"></i>
        </span>
        <span
          v-if="item.color"
          class="source-grid-picker__dot"
          :style="{ background: item.color }"
          aria-hidden="true"
        ></span>
        <i
          v-else-if="item.icon"
          :class="item.icon"
          class="source-grid-picker__icon"
          aria-hidden="true"
        ></i>
        <span class="source-grid-picker__name" :title="item.label">
          {{ item.label }}
        </span>
        <span
          v-if="item.count !== undefined && item.count !== null"
          class="source-grid-picker__count"
        >
          {{ item.count }}
        </span>
      </label>
    </div>

    <p v-if="hint && !loading && items.length > 0" class="source-grid-picker__hint">
      <i class="bi bi-info-circle"></i>
      {{ hint }}
    </p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import BaseSkeleton from '@/components/base/BaseSkeleton.vue'
import BaseButton from '@/components/base/BaseButton.vue'

const { t } = useI18n()

const props = defineProps({
  // Array of values when `multiple` is true; a single value (or null)
  // when it is false.
  modelValue: { type: [Array, String, Number], default: null },
  // Items must have {value, label}. Optional: {color}, {icon}, {count}.
  items: { type: Array, default: () => [] },
  multiple: { type: Boolean, default: false },
  label: { type: String, default: '' },
  icon: { type: String, default: '' },
  loading: { type: Boolean, default: false },
  emptyText: { type: String, default: '' },
  hint: { type: String, default: '' },
  optional: { type: Boolean, default: false },
  showClear: { type: Boolean, default: true },
})

const emit = defineEmits(['update:modelValue'])

const hasSelection = computed(() => {
  if (props.multiple) {
    return Array.isArray(props.modelValue) && props.modelValue.length > 0
  }
  return (
    props.modelValue !== null &&
    props.modelValue !== undefined &&
    props.modelValue !== ''
  )
})

function isSelected(value) {
  if (props.multiple) {
    return Array.isArray(props.modelValue) && props.modelValue.includes(value)
  }
  return props.modelValue === value
}

// A single `toggle` handler for both modes. The input is a checkbox in
// both cases — in single-select mode we simply enforce a max of one
// selection and allow re-clicking the selected item to deselect it.
// That gives the single-select grid a natural "click to pick, click
// again to unpick" gesture without needing a separate radio group.
function toggle(value) {
  if (props.multiple) {
    const current = Array.isArray(props.modelValue) ? props.modelValue : []
    if (current.includes(value)) {
      emit('update:modelValue', current.filter(v => v !== value))
    } else {
      emit('update:modelValue', [...current, value])
    }
  } else {
    if (props.modelValue === value) {
      emit('update:modelValue', null)
    } else {
      emit('update:modelValue', value)
    }
  }
}

function clear() {
  emit('update:modelValue', props.multiple ? [] : null)
}
</script>

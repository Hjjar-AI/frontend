<!-- frontend/src/components/base/BaseSelect.vue -->
<template>
  <div class="base-select" :class="{ 'base-select--error': error }">
    <label v-if="label" :for="selectId" class="base-select__label">
      {{ label }}
      <span v-if="required" class="base-select__required">*</span>
    </label>
    <div class="base-select__wrapper">
      
      <select
        :id="selectId"
        :disabled="disabled"
        :required="required"
        :multiple="multiple"
        :aria-describedby="error ? `${selectId}-error` : undefined"
        @change="handleChange"
        @blur="$emit('blur')"
        @focus="$emit('focus')"
        class="base-select__field"
      >
        <option v-if="placeholder && !multiple" value="" :selected="!hasSelection">{{ placeholder }}</option>
        <option
          v-for="opt in options"
          :key="opt.value"
          :value="opt.value"
          :selected="isSelected(opt.value)"
        >{{ opt.label }}</option>
      </select>
      <i v-if="!multiple" class="bi bi-chevron-down base-select__arrow"></i>
    </div>
    <span v-if="error" :id="`${selectId}-error`" class="base-select__error">{{ error }}</span>
    <span v-if="hint" class="base-select__hint">{{ hint }}</span>
  </div>
</template>

<script setup>
import { computed, getCurrentInstance } from 'vue'

const props = defineProps({
  modelValue: { type: [String, Number, Array], default: '' },
  label: { type: String, default: '' },
  options: { type: Array, required: true },
  placeholder: { type: String, default: '' },
  error: { type: String, default: '' },
  hint: { type: String, default: '' },
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  multiple: { type: Boolean, default: false },
  id: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue', 'blur', 'focus'])

const instance = getCurrentInstance()
const uid = instance.uid

const selectId = computed(() => props.id || `select-${uid}`)

// Whether the model currently carries a value. Only used to keep the
// placeholder option's `:selected` state consistent with what the
// <select> itself reports when nothing is chosen. `null` and
// `undefined` both count as "no selection"; `0` and `false` (valid
// single values in some callers) count as a selection.
const hasSelection = computed(() => {
  if (props.multiple) {
    return Array.isArray(props.modelValue) && props.modelValue.length > 0
  }
  return (
    props.modelValue !== '' &&
    props.modelValue !== null &&
    props.modelValue !== undefined
  )
})

// Compare by string form so:
//   • a numeric option value matches a numeric model entry,
//   • a numeric option value matches a string model entry,
//   • a string option value matches a numeric model entry.
// `String(null)` → 'null', which matches no real option, so a
// null/undefined model selects nothing — the correct degenerate case.
function isSelected(value) {
  if (props.multiple) {
    if (!Array.isArray(props.modelValue)) return false
    return props.modelValue.some(v => String(v) === String(value))
  }
  return String(props.modelValue) === String(value)
}

function handleChange(event) {
  if (props.multiple) {
    const selected = Array.from(event.target.selectedOptions).map(o => {
      const num = Number(o.value)
      return Number.isNaN(num) ? o.value : num
    })
    emit('update:modelValue', selected)
  } else {
    emit('update:modelValue', event.target.value)
  }
}
</script>
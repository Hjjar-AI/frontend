<!-- frontend/src/components/base/BaseSelect.vue -->
<template>
  <BaseField
    :id="selectId"
    class="base-select"
    :class="[$attrs.class, { 'base-select--error': error }]"
    :style="$attrs.style"
    :label="label"
    :hint="hint"
    :error="error"
    :required="required"
    :disabled="disabled"
    :size="size"
    :width="width"
  >
    <template #default="{ id: fieldId, describedBy, invalid }">
      <div class="base-select__wrapper">
        <select
          v-bind="nativeControlAttrs()"
          :id="fieldId"
          :disabled="disabled"
          :required="required"
          :multiple="multiple"
          :aria-describedby="describedBy"
          :aria-invalid="invalid"
          class="base-select__field"
          @change="handleChange"
          @blur="$emit('blur')"
          @focus="$emit('focus')"
        >
          <option v-if="placeholder && !multiple" value="" :selected="!hasSelection">
            {{ placeholder }}
          </option>
          <option
            v-for="opt in options"
            :key="opt.value"
            :value="opt.value"
            :selected="isSelected(opt.value)"
          >
            {{ opt.label }}
          </option>
        </select>
        <i v-if="!multiple" class="bi bi-chevron-down base-select__arrow"></i>
      </div>
    </template>
  </BaseField>
</template>

<script setup>
import { computed, getCurrentInstance, useAttrs } from 'vue'
import BaseField from './BaseField.vue'

defineOptions({ inheritAttrs: false })

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
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large'].includes(value),
  },
  width: {
    type: String,
    default: 'full',
    validator: (value) => ['auto', 'full'].includes(value),
  },
})

const emit = defineEmits(['update:modelValue', 'blur', 'focus'])

const instance = getCurrentInstance()
const attrs = useAttrs()
const uid = instance.uid
function nativeControlAttrs() {
  const { class: _class, style: _style, ...nativeAttrs } = attrs
  return nativeAttrs
}

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
  return props.modelValue !== '' && props.modelValue !== null && props.modelValue !== undefined
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
    return props.modelValue.some((v) => String(v) === String(value))
  }
  return String(props.modelValue) === String(value)
}

function handleChange(event) {
  if (props.multiple) {
    const selected = Array.from(event.target.selectedOptions).map((o) => {
      const num = Number(o.value)
      return Number.isNaN(num) ? o.value : num
    })
    emit('update:modelValue', selected)
  } else {
    emit('update:modelValue', event.target.value)
  }
}
</script>

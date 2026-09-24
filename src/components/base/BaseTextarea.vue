<template>
  <BaseField
    :id="textareaId"
    class="base-textarea"
    :class="[$attrs.class, { 'base-textarea--error': error }]"
    :style="$attrs.style"
    :label="label"
    :hint="hint"
    :error="error"
    :required="required"
    :disabled="disabled"
    :current-length="showCount && maxlength ? characterCount : null"
    :max-length="showCount ? maxlength : null"
    :size="size"
    :width="width"
  >
    <template #default="{ id: fieldId, describedBy, invalid }">
      <textarea
        v-bind="nativeControlAttrs()"
        :id="fieldId"
        ref="textareaRef"
        class="base-textarea__field form-control"
        :value="modelValue"
        :rows="rows"
        :placeholder="placeholder"
        :maxlength="maxlength || undefined"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :dir="dir"
        :aria-label="ariaLabel || undefined"
        :aria-describedby="describedBy"
        :aria-invalid="invalid"
        @input="updateModelValue($event.target.value)"
        @blur="$emit('blur')"
        @focus="$emit('focus')"
      ></textarea>
    </template>
  </BaseField>
</template>

<script setup>
import { computed, getCurrentInstance, ref, useAttrs } from 'vue'
import BaseField from './BaseField.vue'

defineOptions({ inheritAttrs: false })

const props = defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, default: '' },
  hint: { type: String, default: '' },
  error: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  ariaLabel: { type: String, default: '' },
  rows: { type: Number, default: 4 },
  maxlength: { type: Number, default: null },
  showCount: { type: Boolean, default: true },
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  readonly: { type: Boolean, default: false },
  dir: { type: String, default: 'auto' },
  id: { type: String, default: '' },
  modelModifiers: { type: Object, default: () => ({}) },
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
const textareaRef = ref(null)
function nativeControlAttrs() {
  const { class: _class, style: _style, ...nativeAttrs } = attrs
  return nativeAttrs
}
const textareaId = computed(() => props.id || `textarea-${instance.uid}`)
const characterCount = computed(() => String(props.modelValue || '').length)

function updateModelValue(value) {
  emit('update:modelValue', props.modelModifiers.trim ? value.trim() : value)
}

defineExpose({ focus: () => textareaRef.value?.focus() })
</script>

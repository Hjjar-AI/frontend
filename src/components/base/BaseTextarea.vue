<template>
  <BaseField
    :id="textareaId"
    class="base-textarea"
    :class="{ 'base-textarea--error': error }"
    :label="label"
    :hint="hint"
    :error="error"
    :required="required"
    :disabled="disabled"
    :current-length="showCount && maxlength ? characterCount : null"
    :max-length="showCount ? maxlength : null"
  >
    <template #default="{ id: fieldId, describedBy, invalid }">
      <textarea
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
import { computed, getCurrentInstance, ref } from 'vue'
import BaseField from './BaseField.vue'

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
})

const emit = defineEmits(['update:modelValue', 'blur', 'focus'])

const instance = getCurrentInstance()
const textareaRef = ref(null)
const textareaId = computed(() => props.id || `textarea-${instance.uid}`)
const characterCount = computed(() => String(props.modelValue || '').length)

function updateModelValue(value) {
  emit('update:modelValue', props.modelModifiers.trim ? value.trim() : value)
}

defineExpose({ focus: () => textareaRef.value?.focus() })
</script>

<!-- frontend/src/components/base/BaseRadio.vue -->
<template>
  <label class="base-radio" :class="{ 'base-radio--disabled': disabled }">
    <input
      type="radio"
      :name="radioName"
      :value="value"
      :checked="modelValue === value"
      :disabled="disabled"
      @change="$emit('update:modelValue', value)"
      class="base-radio__input"
    />
    <span class="base-radio__circle"></span>
    <span v-if="label" class="base-radio__label">{{ label }}</span>
    <slot v-else />
  </label>
</template>

<script setup>
import { computed, getCurrentInstance } from 'vue'

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  value: { type: [String, Number], required: true },
  label: { type: String, default: '' },
  name: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
})
defineEmits(['update:modelValue'])

const instance = getCurrentInstance()
const parentUid = instance?.parent?.uid ?? instance.uid
const generatedName = `radio-group-${parentUid}`

const radioName = computed(() => {
  if (props.name) return props.name
  return generatedName
})
</script>
<!-- frontend/src/components/base/BaseCheckbox.vue -->
<template>
  <label class="base-checkbox" :class="{ 'base-checkbox--disabled': disabled }">
    <input
      type="checkbox"
      :checked="modelValue"
      :disabled="disabled"
      :indeterminate="indeterminate"
      @change="$emit('update:modelValue', $event.target.checked)"
      class="base-checkbox__input"
      ref="inputRef"
    />
    <span class="base-checkbox__checkmark"></span>
    <span v-if="label" class="base-checkbox__label">{{ label }}</span>
    <slot v-else />
  </label>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  label: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  indeterminate: { type: Boolean, default: false },
})

defineEmits(['update:modelValue'])

const inputRef = ref(null)

// Two distinct event classes → two handlers:
//   • mount time  → onMounted, because inputRef is null during setup
//   • prop change → the watcher below.
//
// The watcher is deliberately NOT `{ immediate: true }`. An immediate
// run executes during setup(), before the template has rendered, so
// `inputRef.value` is still null and the guard short-circuits. The
// mount-time sync is onMounted's job; conflating the two caused the
// prior comment to claim the watcher was handling a case it could not.
watch(
  () => props.indeterminate,
  (val) => {
    if (inputRef.value) {
      inputRef.value.indeterminate = val
    }
  }
)

onMounted(() => {
  if (inputRef.value) {
    inputRef.value.indeterminate = props.indeterminate
  }
})
</script>
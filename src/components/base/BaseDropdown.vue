<!-- frontend/src/components/base/BaseDropdown.vue -->
<template>
  <div class="base-dropdown" ref="rootRef">
    <button
      type="button"
      class="base-dropdown__toggle"
      :disabled="disabled"
      :aria-expanded="isOpen"
      :aria-haspopup="'listbox'"
      :aria-label="ariaLabel || undefined"
      @click.stop="toggle"
    >
      <i v-if="icon" :class="icon"></i>
      <span class="base-dropdown__value">{{ selectedLabel }}</span>
      <i
        class="bi bi-chevron-down base-dropdown__arrow"
        :class="{ 'base-dropdown__arrow--open': isOpen }"
      ></i>
    </button>

    <Transition name="dropdown">
      <div v-show="isOpen" class="base-dropdown__menu menu-surface" role="listbox">
        <button
          v-for="opt in options"
          :key="String(opt.value)"
          type="button"
          role="option"
          class="base-dropdown__item"
          :class="{ 'base-dropdown__item--active': opt.value === modelValue }"
          :aria-selected="opt.value === modelValue"
          @click="select(opt.value)"
        >
          <span class="base-dropdown__item-label">{{ opt.label }}</span>
          <i
            v-if="opt.value === modelValue"
            class="bi bi-check2 base-dropdown__item-check"
          ></i>
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useDropdown } from '@/composables/useDropdown'

const props = defineProps({
  modelValue: { type: [String, Number], default: null },
  options: { type: Array, required: true },
  // Bootstrap-Icon class shown before the value. Optional.
  icon: { type: String, default: '' },
  // Accessible name for the toggle when no visible label accompanies it.
  ariaLabel: { type: String, default: '' },
  // Shown on the toggle when modelValue matches no option.
  placeholder: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

// Pass a disabled predicate so the composable blocks open() when the
// toggle is disabled — the previous implementation checked
// props.disabled inside open(), and the template also disables the
// <button>. Both layers are preserved: the <button> is still
// :disabled in the template, and the composable independently
// refuses to open.
const { isOpen, rootRef, close, toggle } = useDropdown({
  isDisabled: () => props.disabled,
})

// Matches by strict equality. The Analytics day options are numbers
// and the model is a number, so this is fine. If a future caller needs
// string/number coercion, add a `valueKey` prop rather than loosening
// the comparison here.
const selectedLabel = computed(() => {
  const found = props.options.find(o => o.value === props.modelValue)
  return found ? found.label : props.placeholder
})

function select(value) {
  emit('update:modelValue', value)
  close()
}
</script>
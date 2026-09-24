<template>
  <component
    :is="interactive && !removable ? 'button' : 'span'"
    class="base-chip"
    :class="[
      `base-chip--${variant}`,
      { 'base-chip--active': active, 'base-chip--interactive': interactive, 'base-chip--compact': compact },
    ]"
    :type="interactive && !removable ? 'button' : undefined"
    :disabled="interactive && !removable ? disabled : undefined"
    :aria-pressed="interactive && !removable ? active : undefined"
    @click="handleClick"
  >
    <i v-if="icon" :class="icon" aria-hidden="true"></i>
    <span class="base-chip__label"><slot /></span>
    <button
      v-if="removable"
      type="button"
      class="base-chip__remove"
      :disabled="disabled"
      :aria-label="removeLabel"
      @click.stop="$emit('remove')"
    >
      <i class="bi bi-x" aria-hidden="true"></i>
    </button>
  </component>
</template>

<script setup>
const props = defineProps({
  variant: {
    type: String,
    default: 'secondary',
    validator: value => ['primary', 'secondary', 'info', 'success', 'warning', 'danger'].includes(value),
  },
  icon: { type: String, default: '' },
  active: { type: Boolean, default: false },
  interactive: { type: Boolean, default: false },
  removable: { type: Boolean, default: false },
  compact: { type: Boolean, default: true },
  disabled: { type: Boolean, default: false },
  removeLabel: { type: String, default: 'Remove' },
})

const emit = defineEmits(['click', 'remove'])

function handleClick(event) {
  if (props.interactive && !props.disabled) emit('click', event)
}
</script>

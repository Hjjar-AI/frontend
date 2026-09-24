<!-- frontend/src/components/base/BaseCard.vue -->
<template>
  <component
    :is="as"
    class="base-card"
    :class="[
      `base-card--${variant}`,
      {
        'base-card--hover': hover || interactive,
        'base-card--interactive': interactive,
        'base-card--custom-accent': accentColor,
      }
    ]"
    :style="accentColor ? { borderInlineStartColor: accentColor } : null"
    :tabindex="interactive ? 0 : undefined"
    :role="interactive ? 'button' : undefined"
    :aria-label="ariaLabel || undefined"
    @click="handleClick"
    @keydown.enter="handleKeyboard"
    @keydown.space="handleKeyboard"
  >
    <slot />
  </component>
</template>
<script setup>
const props = defineProps({
  variant: {
    type: String,
    default: 'default',

    validator: (v) => ['default', 'primary', 'secondary', 'info', 'danger', 'success', 'warning'].includes(v),
  },
  hover: { type: Boolean, default: false },
  accentColor: { type: String, default: '' },
  interactive: { type: Boolean, default: false },
  as: { type: [String, Object], default: 'div' },
  ariaLabel: { type: String, default: '' },
})

const emit = defineEmits(['activate'])

function isNestedControl(event) {
  return event.target !== event.currentTarget && Boolean(
    event.target.closest('a, button, input, select, textarea, [role="button"], [tabindex]'),
  )
}

function handleClick(event) {
  if (!props.interactive || isNestedControl(event)) return
  emit('activate', event)
}

function handleKeyboard(event) {
  if (!props.interactive || event.target !== event.currentTarget) return
  event.preventDefault()
  emit('activate', event)
}
</script>

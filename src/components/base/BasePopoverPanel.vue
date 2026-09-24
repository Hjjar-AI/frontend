<template>
  <Transition :name="transition">
    <div
      v-show="open"
      class="base-popover-panel menu-surface"
      :class="panelClass"
      :role="role || undefined"
      @click="$emit('click', $event)"
    >
      <slot />
    </div>
  </Transition>
</template>

<script setup>
defineProps({
  open: { type: Boolean, default: false },
  panelClass: { type: [String, Array, Object], default: '' },
  role: { type: String, default: '' },
  transition: { type: String, default: 'dropdown' },
})

defineEmits(['click'])
</script>

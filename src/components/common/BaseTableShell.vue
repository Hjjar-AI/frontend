<template>
  <div
    class="table-shell"
    :class="[
      `table-shell--${density}`,
      { 'table-shell--striped': striped, 'table-shell--sticky': sticky },
    ]"
    :style="maxHeight ? { maxHeight } : undefined"
  >
    <slot />
  </div>
</template>

<script setup>
defineProps({
  density: { type: String, default: 'normal', validator: value => ['compact', 'normal', 'comfortable'].includes(value) },
  striped: { type: Boolean, default: false },
  sticky: { type: Boolean, default: false },
  maxHeight: { type: String, default: '' },
})
</script>

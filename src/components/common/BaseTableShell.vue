<template>
  <div
    class="table-shell"
    :class="[
      `table-shell--${density}`,
      `table-shell--mobile-${mobileMode}`,
      { 'table-shell--striped': striped, 'table-shell--sticky': sticky },
    ]"
    :style="maxHeight ? { maxHeight } : undefined"
    role="region"
    :aria-label="ariaLabel || undefined"
    tabindex="0"
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
  mobileMode: { type: String, default: 'scroll', validator: value => ['scroll', 'columns', 'cards'].includes(value) },
  ariaLabel: { type: String, default: '' },
})
</script>

<template>
  <div class="page-actions">
    <div v-if="$slots.secondary" class="page-actions__secondary">
      <slot name="secondary" />
    </div>
    <div class="page-actions__primary">
      <slot />
    </div>
  </div>
</template>


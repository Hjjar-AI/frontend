<template>
  <header class="section-header" :class="{ 'section-header--compact': compact }">
    <div class="section-header__content">
      <component :is="`h${level}`" class="section-header__title">
        <i v-if="icon" :class="icon" aria-hidden="true"></i>
        {{ title }}
      </component>
      <p v-if="description" class="section-header__description">{{ description }}</p>
    </div>
    <div v-if="$slots.badges" class="section-header__badges"><slot name="badges" /></div>
    <div v-if="$slots.actions" class="section-header__actions"><slot name="actions" /></div>
  </header>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  icon: { type: String, default: '' },
  level: { type: Number, default: 2, validator: value => value >= 2 && value <= 6 },
  compact: { type: Boolean, default: false },
})
</script>

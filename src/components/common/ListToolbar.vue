<template>
  <section class="list-toolbar" :aria-label="ariaLabel || undefined">
    <div class="list-toolbar__header ui-cluster">
      <BaseButton
        v-if="collapsible"
        variant="ghost"
        size="small"
        :icon="collapsed ? 'bi bi-funnel' : 'bi bi-funnel-fill'"
        :aria-expanded="!collapsed"
        @click="collapsed = !collapsed"
      >
        {{ collapsed ? showLabel : hideLabel }}
        <span v-if="activeCount > 0 && collapsed" class="list-toolbar__count">{{ activeCount }}</span>
      </BaseButton>

      <div v-if="$slots.summary" class="list-toolbar__summary">
        <slot name="summary" />
      </div>

      <div v-if="$slots.actions || (resetLabel && activeCount > 0)" class="list-toolbar__actions ui-cluster">
        <slot name="actions" />
        <BaseButton
          v-if="resetLabel && activeCount > 0"
          variant="ghost"
          size="small"
          icon="bi bi-arrow-counterclockwise"
          @click="$emit('reset')"
        >
          {{ resetLabel }}
        </BaseButton>
      </div>
    </div>

    <Transition name="filter-collapse">
      <div v-show="!collapsible || !collapsed" class="list-toolbar__controls ui-cluster">
        <div v-if="$slots.search" class="list-toolbar__search"><slot name="search" /></div>
        <div v-if="$slots.filters" class="list-toolbar__filters ui-cluster"><slot name="filters" /></div>
        <slot />
      </div>
    </Transition>

    <div v-if="$slots.chips" class="list-toolbar__chips ui-cluster">
      <slot name="chips" />
    </div>
  </section>
</template>

<script setup>
import BaseButton from '@/components/base/BaseButton.vue'

const collapsed = defineModel('collapsed', { type: Boolean, default: false })

defineProps({
  ariaLabel: { type: String, default: '' },
  collapsible: { type: Boolean, default: false },
  activeCount: { type: Number, default: 0 },
  showLabel: { type: String, default: 'Show filters' },
  hideLabel: { type: String, default: 'Hide filters' },
  resetLabel: { type: String, default: '' },
})

defineEmits(['reset'])
</script>

<!--
  Standard page composition for authenticated, navbar-based routes.

  Layout owns the application chrome. PageShell owns the content column,
  page heading, optional introductory copy, and the stable slots surrounding
  page content. Feature-specific classes can be retained through `pageClass`.
-->
<template>
  <div
    class="page-shell"
    :class="[`page-shell--${size}`, pageClass]"
  >
    <PageHeader :title="title" :icon="icon" :level="1">
      <template v-if="$slots.badges" #badges>
        <slot name="badges" />
      </template>
      <template v-if="$slots.actions" #actions>
        <PageActions><slot name="actions" /></PageActions>
      </template>
    </PageHeader>

    <div v-if="subtitle || $slots.intro" class="page-shell__intro">
      <slot name="intro">{{ subtitle }}</slot>
    </div>

    <div v-if="$slots.feedback || error || warning || success || info" class="page-shell__feedback">
      <slot name="feedback">
        <FeedbackRegion
          :error="error"
          :warning="warning"
          :success="success"
          :info="info"
          :retry="retry"
          @dismiss="$emit('dismiss-feedback')"
          @retry="$emit('retry')"
        />
      </slot>
    </div>

    <slot />
  </div>
</template>

<script setup>
import PageHeader from './PageHeader.vue'
import PageActions from './PageActions.vue'
import FeedbackRegion from './FeedbackRegion.vue'

defineProps({
  title: { type: String, required: true },
  icon: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  size: {
    type: String,
    default: 'wide',
    validator: (value) => ['form', 'narrow', 'medium', 'base', 'wide', 'fluid'].includes(value),
  },
  pageClass: {
    type: [String, Array, Object],
    default: '',
  },
  error: { type: String, default: '' },
  warning: { type: String, default: '' },
  success: { type: String, default: '' },
  info: { type: String, default: '' },
  retry: { type: Boolean, default: false },
})

defineEmits(['dismiss-feedback', 'retry'])
</script>

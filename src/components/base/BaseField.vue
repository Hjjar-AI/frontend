<!-- frontend/src/components/base/BaseField.vue -->
<template>
  <div
    class="base-field"
    :class="[
      `base-field--${size}`,
      `base-field--width-${width}`,
      { 'base-field--error': error, 'base-field--disabled': disabled },
    ]"
  >
    <div v-if="label || $slots.label" class="base-field__label-row">
      <label :for="fieldId" class="base-field__label">
        <slot name="label">{{ label }}</slot>
        <span v-if="required" class="base-field__required" aria-hidden="true">*</span>
        <span v-else-if="optionalLabel" class="base-field__optional">{{ optionalLabel }}</span>
      </label>
    </div>
    <div class="base-field__control">
      <!--
        Slot props give every wrapped control the association data it
        needs:

          • `id`          — the value the `<label for>` points at.
                            Bind it on the input's `id` attribute.
          • `errorId`     — the id of the error span (when rendered).
          • `hintId`      — the id of the hint span (when rendered).
          • `describedBy` — the id of whichever assistive text is
                            currently rendered (error wins over hint,
                            matching the v-if/v-else-if below). Bind
                            it on the input's `aria-describedby`.

        Before this change, the label's `for` attribute pointed at a
        non-existent id, and the error/hint spans were invisible to
        assistive technology because nothing referenced them.

        The props are optional — a caller that ignores them continues
        to work (just without the association). Existing call sites
        that did not use the slot-prop syntax are unaffected by the
        addition.
      -->
      <slot
        :id="fieldId"
        :field-id="fieldId"
        :error-id="errorId"
        :hint-id="hintId"
        :described-by="describedBy"
        :invalid="Boolean(error)"
      />
    </div>
    <div v-if="error || hint || hasCount" class="base-field__feedback">
      <span v-if="error" :id="errorId" class="base-field__error" role="alert">{{ error }}</span>
      <span v-else-if="hint" :id="hintId" class="base-field__hint">{{ hint }}</span>
      <span
        v-if="hasCount"
        class="base-field__count"
        :class="{ 'base-field__count--limit': atLimit }"
      >
        {{ currentLength }}/{{ maxLength }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed, getCurrentInstance } from 'vue'

const props = defineProps({
  label: { type: String, default: '' },
  hint: { type: String, default: '' },
  error: { type: String, default: '' },
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  optionalLabel: { type: String, default: '' },
  currentLength: { type: Number, default: null },
  maxLength: { type: Number, default: null },
  id: { type: String, default: '' },
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large'].includes(value),
  },
  width: {
    type: String,
    default: 'full',
    validator: (value) => ['auto', 'full'].includes(value),
  },
})

const instance = getCurrentInstance()
const uid = instance.uid

const fieldId = computed(() => props.id || `field-${uid}`)
const errorId = computed(() => `${fieldId.value}-error`)
const hintId = computed(() => `${fieldId.value}-hint`)
const hasCount = computed(() => props.currentLength !== null && props.maxLength !== null)
const atLimit = computed(() => hasCount.value && props.currentLength >= props.maxLength)

// The described-by target matches whichever span the template
// actually renders. `v-if="error"` wins over `v-else-if="hint"`, so
// the computed follows the same priority: an error, when present,
// is the accessible description; otherwise the hint is.
const describedBy = computed(() => {
  if (props.error) return errorId.value
  if (props.hint) return hintId.value
  return null
})
</script>

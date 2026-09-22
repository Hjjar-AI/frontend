<!-- frontend/src/components/base/BaseField.vue -->
<template>
  <div class="base-field">
    <label v-if="label" :for="fieldId" class="base-field__label">
      {{ label }}
      <span v-if="required" class="base-field__required">*</span>
    </label>
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
      />
    </div>
    <span v-if="error" :id="errorId" class="base-field__error">{{ error }}</span>
    <span v-else-if="hint" :id="hintId" class="base-field__hint">{{ hint }}</span>
  </div>
</template>

<script setup>
import { computed, getCurrentInstance } from 'vue'

const props = defineProps({
  label: { type: String, default: '' },
  hint: { type: String, default: '' },
  error: { type: String, default: '' },
  required: { type: Boolean, default: false },
  id: { type: String, default: '' },
})

const instance = getCurrentInstance()
const uid = instance.uid

const fieldId = computed(() => props.id || `field-${uid}`)
const errorId = computed(() => `${fieldId.value}-error`)
const hintId = computed(() => `${fieldId.value}-hint`)

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
<!-- frontend/src/components/base/BaseInput.vue -->
<template>
  <div class="base-input" :class="{ 'base-input--error': error }">
    <label v-if="label" :for="inputId" class="base-input__label">
      {{ label }}
      <span v-if="required" class="base-input__required">*</span>
    </label>

    <!-- ── Number variant ───────────────────────────────────────────
         The native <input type="number"> spinner is pinned to the
         inline-end edge by the browser and cannot be repositioned
         with CSS. To put the spinner on the inline-start edge of the
         control (as the design calls for), we hide the native spinner
         via `appearance: textfield` and render our own chevron pair
         before the field inside a flex group.

         DOM order inside `.base-input__number-group`:
             spinner, then input
         Flex `row` lays them out from inline-start to inline-end, so
         the browser mirrors the whole group automatically in RTL:

             LTR:  [ ▲▼ 10 ................ × ]
             RTL:  [ × ................ 10 ▲▼ ]

         The clear button sits at the far end via
         `margin-inline-start: auto`.

         The wrapper owns the border/background; the field is bare.
         That way the spinner, field, and clear render as one unit and
         the wrapper behaves like a single form control. -->
    <div
      v-if="type === 'number'"
      class="base-input__number"
      :class="{ 'base-input__number--disabled': disabled }"
    >
      <div class="base-input__number-group">
        <div class="base-input__number-spinner">
          <button
            type="button"
            class="base-input__number-btn"
            :disabled="disabled || readonly || isAtMax"
            tabindex="-1"
            :aria-label="t('ui.increment')"
            @click="increment"
          >
            <i class="bi bi-chevron-up"></i>
          </button>
          <button
            type="button"
            class="base-input__number-btn"
            :disabled="disabled || readonly || isAtMin"
            tabindex="-1"
            :aria-label="t('ui.decrement')"
            @click="decrement"
          >
            <i class="bi bi-chevron-down"></i>
          </button>
        </div>
        <input
          ref="inputRef"
          :id="inputId"
          type="number"
          :value="modelValue"
          :placeholder="placeholder"
          :min="min"
          :max="max"
          :disabled="disabled"
          :readonly="readonly"
          :required="required"
          :aria-describedby="error ? `${inputId}-error` : undefined"
          @input="$emit('update:modelValue', $event.target.value)"
          @blur="$emit('blur')"
          @focus="$emit('focus')"
          @keydown.enter="$emit('enter', $event)"
          class="base-input__number-field"
        />
      </div>
      <button
        v-if="showClearButton"
        type="button"
        class="base-input__number-clear"
        :disabled="disabled || readonly"
        :aria-label="t('ui.clearField')"
        @click="$emit('update:modelValue', '')"
      >
        <i class="bi bi-x-lg"></i>
      </button>
    </div>

    <!-- ── Text-like variants (text, email, search, password, …) ──── -->
    <div v-else class="base-input__wrapper">
      <input
        ref="inputRef"
        :id="inputId"
        :type="showPassword ? 'text' : type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :required="required"
        :min="min"
        :max="max"
        :minlength="minlength"
        :inputmode="inputmode"
        :aria-describedby="error ? `${inputId}-error` : undefined"
        @input="$emit('update:modelValue', $event.target.value)"
        @blur="$emit('blur')"
        @focus="$emit('focus')"
        @keydown.enter="$emit('enter', $event)"
        class="base-input__field form-control"
      />
      <button
        v-if="showClearButton"
        type="button"
        class="base-input__clear"
        :class="{ 'base-input__clear--offset': type === 'password' }"
        @click="$emit('update:modelValue', '')"
        :aria-label="t('ui.clearField')"
      >
        <i class="bi bi-x-lg"></i>
      </button>
      <button
        v-if="type === 'password'"
        type="button"
        class="base-input__toggle"
        @click="showPassword = !showPassword"
        :aria-label="showPassword ? t('ui.hidePassword') : t('ui.showPassword')"
      >
        <i :class="showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
      </button>
    </div>

    <div class="base-input__feedback">
      <span v-if="error" :id="`${inputId}-error`" class="base-input__error">{{ error }}</span>
      <span v-if="hint && !error" class="base-input__hint">{{ hint }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, getCurrentInstance } from 'vue'


const { t } = useI18n()

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  label: { type: String, default: '' },
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  error: { type: String, default: '' },
  hint: { type: String, default: '' },
  required: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  readonly: { type: Boolean, default: false },
  min: { type: Number, default: undefined },
  max: { type: Number, default: undefined },
  minlength: { type: Number, default: undefined },
  inputmode: { type: String, default: undefined },
  id: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue', 'blur', 'focus', 'enter'])

const instance = getCurrentInstance()
const uid = instance.uid

const showPassword = ref(false)

const inputRef = ref(null)

function focus() {
  inputRef.value?.focus()
}

defineExpose({ focus })

const inputId = computed(() => props.id || `input-${uid}`)

const showClearButton = computed(() => {
  const clearableTypes = ['text', 'search', 'number', 'email', 'password']
  return (
    clearableTypes.includes(props.type) &&
    props.modelValue !== '' &&
    props.modelValue !== null &&
    props.modelValue !== undefined
  )
})

// ── Number spinner handlers ─────────────────────────────────────────
//
// Kept inside the component so every number input gets the same
// stepping behaviour for free. Bounds are checked here as a hard
// guard — the native `min`/`max` attributes on the input already
// clamp typed values, but the buttons must not emit an out-of-range
// value either, or the model would briefly hold one.
//
// EMIT TYPE
// ---------
// Both this button path and the native `@input` path emit a STRING.
// The native path does so automatically (`$event.target.value` on a
// number input is always a string); the button path must match, or a
// single consumer's `v-model` receives a string from a typed edit
// and a number from a spinner click — and every downstream
// comparison, arithmetic expression, or template interpolation then
// produces a different result depending on which path the user took.
//
// Consumers who need a number use `v-model.number` (the Vue modifier
// coerces the string on assignment, either path). Consumers who use
// plain `v-model` now receive a string from both paths, which is what
// they already got from the native input before this change.

const numericValue = computed(() => {
  const n = Number(props.modelValue)
  return Number.isFinite(n) ? n : 0
})

const isAtMax = computed(() =>
  props.max !== undefined && numericValue.value >= props.max
)

const isAtMin = computed(() =>
  props.min !== undefined && numericValue.value <= props.min
)

function increment() {
  if (props.disabled || props.readonly || isAtMax.value) return
  // String(...) — not the number itself — so the emitted type is
  // identical to the native input path. See the EMIT TYPE note above.
  emit('update:modelValue', String(numericValue.value + 1))
}

function decrement() {
  if (props.disabled || props.readonly || isAtMin.value) return
  emit('update:modelValue', String(numericValue.value - 1))
}
</script>
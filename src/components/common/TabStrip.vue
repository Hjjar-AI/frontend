<!-- frontend/src/components/common/TabStrip.vue -->
<!--
  Horizontal tab strip with a shared interaction contract.

  USAGE
  -----
    <TabStrip
      v-model="activeTab"
      :tabs="[
        { key: 'roles', label: t('…'), icon: 'bi bi-people-fill' },
        { key: 'users', label: t('…'), icon: 'bi bi-person-gear' },
      ]"
    />

  Each tab object is `{ key, label, icon?, count? }`. `key` is the
  value the model takes; `icon` and `count` are optional.

  VARIANT
  -------
  'underline' — bottom-border accent (default; matches the previous
                 Permissions and MasterExamList strips).
  'pills'     — rounded pill (matches the previous Import tab row).

  ARIA / KEYBOARD
  ---------------
  `role="tablist"` on the container, `role="tab"` on each button.
  Only the active tab is in the tab order (`tabindex: 0` vs `-1`);
  arrow keys move focus AND activate the target tab. Home/End jump
  to the ends. Left/right mapping follows the document direction via
  the `dir` attribute, so RTL users get the natural direction.

  SPACING
  -------
  This component owns no outer margins. A caller that wants the strip
  separated from its neighbours adds `margin` to the wrapper. The
  previous `.master-exam-tab` global rule carried its own top/bottom
  margins; the strip does not, and the caller is expected to supply
  them where the visual rhythm calls for it.
-->
<template>
  <div
    class="tab-strip"
    :class="`tab-strip--${variant}`"
    role="tablist"
    :aria-label="ariaLabel || undefined"
  >
    <button
      v-for="tab in tabs"
      :key="tab.key"
      type="button"
      role="tab"
      class="tab-strip__tab"
      :class="{ 'tab-strip__tab--active': tab.key === modelValue }"
      :aria-selected="tab.key === modelValue"
      :tabindex="tab.key === modelValue ? 0 : -1"
      @click="select(tab.key)"
      @keydown="handleKeydown"
    >
      <i v-if="tab.icon" :class="tab.icon" aria-hidden="true"></i>
      <span class="tab-strip__label">{{ tab.label }}</span>
      <span
        v-if="tab.count !== undefined && tab.count !== null"
        class="tab-strip__count"
      >{{ tab.count }}</span>
    </button>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: [String, Number], required: true },
  tabs: {
    type: Array,
    required: true,
    // Each entry: { key, label, icon?, count? }
  },
  variant: {
    type: String,
    default: 'underline',
    validator: (v) => ['underline', 'pills'].includes(v),
  },
  ariaLabel: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue'])

function select(key) {
  if (key !== props.modelValue) {
    emit('update:modelValue', key)
  }
}

function handleKeydown(event) {
  // Read the direction fresh at keydown time. A computed would be
  // cached forever because it has no reactive dependencies —
  // `document.documentElement.getAttribute('dir')` is not a value
  // Vue can track. Keydown is a user event, not a render-time
  // concern, so a static read is the correct shape here.
  const isRTL =
    typeof document !== 'undefined' &&
    document.documentElement.getAttribute('dir') === 'rtl'

  const currentIndex = props.tabs.findIndex((t) => t.key === props.modelValue)

  // Left/right arrows advance or retreat by one tab, following the
  // document's reading direction. In RTL, "next" is left.
  const forwardKey = isRTL ? 'ArrowLeft' : 'ArrowRight'
  const backwardKey = isRTL ? 'ArrowRight' : 'ArrowLeft'

  let nextIndex = null

  if (event.key === forwardKey) {
    nextIndex = (currentIndex + 1) % props.tabs.length
  } else if (event.key === backwardKey) {
    nextIndex = (currentIndex - 1 + props.tabs.length) % props.tabs.length
  } else if (event.key === 'Home') {
    nextIndex = 0
  } else if (event.key === 'End') {
    nextIndex = props.tabs.length - 1
  }

  if (nextIndex === null) return
  event.preventDefault()

  // Capture the container before the emit. The buttons list is
  // stable across a tab change (only their classes change), so
  // `.focus()` finds the right element regardless of when Vue's DOM
  // update lands.
  const container = event.currentTarget?.parentElement
  const targetIndex = nextIndex

  select(props.tabs[targetIndex].key)

  if (!container) return
  const buttons = container.querySelectorAll('.tab-strip__tab')
  const target = buttons[targetIndex]
  if (target) target.focus()
}
</script>

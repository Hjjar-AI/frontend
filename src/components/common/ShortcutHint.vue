<!-- frontend/src/components/common/ShortcutHint.vue -->
<template>
  <div class="shortcut-hint" aria-live="polite" aria-atomic="true">
    <button
      class="shortcut-hint__toggle"
      @click="expanded = !expanded"
      :aria-expanded="expanded"
      :title="t('tests.shortcutToggle')"
      :aria-label="t('tests.shortcutToggle')"
    >
      <i class="bi bi-keyboard"></i>
      <span class="shortcut-hint__badge">⌨</span>
    </button>
    <Transition name="hint">
      <div v-if="expanded" class="shortcut-hint__panel menu-surface">
        <div class="shortcut-hint__item">
          
          <kbd>1</kbd>–<kbd>{{ maxChoiceHint }}</kbd>
          <span>{{ t('tests.shortcutChoice') }}</span>
        </div>
        <div class="shortcut-hint__item">
          
          <kbd>{{ nextArrowGlyph }}</kbd> <span>{{ t('tests.shortcutNext') }}</span>
          <kbd>{{ prevArrowGlyph }}</kbd> <span>{{ t('tests.shortcutPrevious') }}</span>
        </div>
        <div class="shortcut-hint__item">
          <kbd>Esc</kbd> <span>{{ t('tests.shortcutFinish') }}</span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useConfigStore } from '@/stores/configStore'
import { useDirection } from '@/composables/useDirection'
import { FALLBACK_MAX_CHOICES } from '@/utils/constants'


const { t } = useI18n()

const configStore = useConfigStore()
const { isRTL } = useDirection()

const expanded = ref(false)

const maxChoiceHint = computed(() => configStore.maxChoices || FALLBACK_MAX_CHOICES)

// Mirror of the flip in useTestNavigation.js:
//   LTR — ArrowRight = next, ArrowLeft = previous
//   RTL — ArrowRight = previous, ArrowLeft = next
const nextArrowGlyph = computed(() => (isRTL.value ? '←' : '→'))
const prevArrowGlyph = computed(() => (isRTL.value ? '→' : '←'))
</script>
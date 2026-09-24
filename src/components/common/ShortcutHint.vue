<!-- frontend/src/components/common/ShortcutHint.vue -->
<template>
  <div ref="rootRef" class="shortcut-hint" aria-live="polite" aria-atomic="true">
    <BaseIconButton
      class="shortcut-hint__toggle"
      icon="bi bi-keyboard"
      :label="t('tests.shortcutToggle')"
      :aria-expanded="isOpen"
      @click.stop="toggle"
    >
      <template #badge><BaseBadge variant="info" small class="shortcut-hint__badge">⌨</BaseBadge></template>
    </BaseIconButton>
    <BasePopoverPanel :open="isOpen" panel-class="shortcut-hint__panel" transition="hint">
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
    </BasePopoverPanel>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useConfigStore } from '@/stores/configStore'
import { useDirection } from '@/composables/useDirection'
import { FALLBACK_MAX_CHOICES } from '@/utils/constants'
import { useDropdown } from '@/composables/useDropdown'
import BaseIconButton from '@/components/base/BaseIconButton.vue'
import BasePopoverPanel from '@/components/base/BasePopoverPanel.vue'
import BaseBadge from '@/components/base/BaseBadge.vue'


const { t } = useI18n()

const configStore = useConfigStore()
const { isRTL } = useDirection()

const { isOpen, rootRef, toggle } = useDropdown()

const maxChoiceHint = computed(() => configStore.maxChoices || FALLBACK_MAX_CHOICES)

// Mirror of the flip in useTestNavigation.js:
//   LTR — ArrowRight = next, ArrowLeft = previous
//   RTL — ArrowRight = previous, ArrowLeft = next
const nextArrowGlyph = computed(() => (isRTL.value ? '←' : '→'))
const prevArrowGlyph = computed(() => (isRTL.value ? '→' : '←'))
</script>

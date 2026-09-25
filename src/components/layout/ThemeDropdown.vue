<!-- frontend/src/components/layout/ThemeDropdown.vue -->
<template>
  <div ref="rootRef" class="theme-dropdown">
    <BaseButton
      variant="ghost"
      size="small"
      raw-content
      class="theme-dropdown__toggle"
      :aria-label="t('theme.label')"
      :title="t('theme.label')"
      :aria-expanded="isOpen"
      aria-haspopup="true"
      @click.stop="toggle"
    >
      <i :class="currentThemeIcon"></i>
      <i
        class="bi bi-chevron-down theme-dropdown__arrow"
        :class="{ 'theme-dropdown__arrow--open': isOpen }"
      ></i>
    </BaseButton>
    <BasePopoverPanel :open="isOpen" panel-class="theme-dropdown__menu">
        <BaseButton
          v-for="theme in THEMES"
          :key="theme"
          variant="ghost"
          size="small"
          raw-content
          class="theme-dropdown__item"
          :class="{ 'theme-dropdown__item--active': theme === currentTheme }"
          @click="selectTheme(theme)"
        >
          <span class="theme-dropdown__swatch" :data-theme="theme" aria-hidden="true">
            <span class="theme-dropdown__swatch-card"></span>
            <span class="theme-dropdown__swatch-primary"></span>
            <span class="theme-dropdown__swatch-info"></span>
          </span>
          <span class="theme-dropdown__item-label">{{ t(`theme.${theme}`) }}</span>
          <i
            v-if="theme === currentTheme"
            class="bi bi-check2 theme-dropdown__item-check"
          ></i>
        </BaseButton>
    </BasePopoverPanel>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useTheme } from '@/composables/useTheme'
import { useDropdown } from '@/composables/useDropdown'
import BasePopoverPanel from '@/components/base/BasePopoverPanel.vue'
import BaseButton from '@/components/base/BaseButton.vue'

const { t } = useI18n()
const { currentTheme, applyTheme, THEMES } = useTheme()

// All of open/close/toggle/click-outside/Escape/focus-return now
// live in useDropdown().
const { isOpen, rootRef, close, toggle } = useDropdown()

const themeIcons = {
  stone: 'bi bi-gem',
  dark: 'bi bi-moon-fill',
  onyx: 'bi bi-moon-stars-fill',
  blossom: 'bi bi-flower1',
  fresh: 'bi bi-tree-fill',
  contrast: 'bi bi-circle-half',
  ink: 'bi bi-pen-fill',
  slate: 'bi bi-cloud-fill',
  amber: 'bi bi-sun-fill',
}
const currentThemeIcon = computed(() => themeIcons[currentTheme.value] || 'bi bi-palette')

function selectTheme(theme) {
  applyTheme(theme)
  close()
}
</script>

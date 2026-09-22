<!-- frontend/src/components/layout/ThemeDropdown.vue -->
<template>
  <div class="theme-dropdown" ref="rootRef">
    <button
      class="theme-dropdown__toggle"
      @click.stop="toggle"
      :aria-label="t('theme.label')"
      :title="t('theme.label')"
    >
      <i :class="currentThemeIcon"></i>
      <i
        class="bi bi-chevron-down theme-dropdown__arrow"
        :class="{ 'theme-dropdown__arrow--open': isOpen }"
      ></i>
    </button>
    <Transition name="dropdown">
      <div v-show="isOpen" class="theme-dropdown__menu menu-surface">
        <button
          v-for="theme in THEMES"
          :key="theme"
          class="theme-dropdown__item"
          :class="{ 'theme-dropdown__item--active': theme === currentTheme }"
          @click="selectTheme(theme)"
        >
          <i :class="getThemeIcon(theme)" class="theme-dropdown__item-icon"></i>
          <span class="theme-dropdown__item-label">{{ t(`theme.${theme}`) }}</span>
          <i
            v-if="theme === currentTheme"
            class="bi bi-check2 theme-dropdown__item-check"
          ></i>
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useTheme } from '@/composables/useTheme'
import { useDropdown } from '@/composables/useDropdown'

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
  sepia: 'bi bi-book-fill',
}
const currentThemeIcon = computed(() => themeIcons[currentTheme.value] || 'bi bi-palette')

function getThemeIcon(theme) {
  return themeIcons[theme] || 'bi bi-palette'
}

function selectTheme(theme) {
  applyTheme(theme)
  close()
}
</script>

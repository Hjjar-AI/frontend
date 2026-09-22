// frontend/src/composables/useTheme.js
//
// Theme state and switching.
//
// BOOT-TIME COORDINATION
// ----------------------
// The initial value of `currentTheme` here is the Stone default, but the
// actual DOM `data-theme` attribute is written by an inline script
// in index.html BEFORE any CSS paints. That script reads
// `localStorage['theme']` and sets `<html data-theme>` so the very
// first paint is already on the correct theme (no default-theme flash).
//
// `loadSavedTheme()` below runs from main.js after the i18n and
// pinia setup, and syncs the reactive ref to match what the
// bootstrap script already wrote. If a caller imports this module
// and reads `currentTheme.value` before `loadSavedTheme()` runs,
// the value it sees is `'stone'` — reading `document.documentElement
// .dataset.theme` is the correct way to see the actual active theme
// in that window.

import { ref, computed } from 'vue'
import { i18n } from '@/i18n'
import {
  DARK_THEMES,
  DEFAULT_THEME,
  THEMES,
  normalizeTheme,
} from '@/utils/constants'
import { storageService } from '@/services/storageService'

const currentTheme = ref(DEFAULT_THEME)

function translateTheme(theme) {
  return i18n.global.t(`theme.${theme}`)
}

function announceTheme(theme) {
  const announcer = document.getElementById('a11y-announcer')
  if (announcer) {
    announcer.textContent = i18n.global.t('theme.changed', {
      theme: translateTheme(theme),
    })
  }
}

export function applyTheme(theme) {
  // Two guards, both cheap and both necessary.
  //
  // 1. Unknown theme → fall back to Stone. The value came from
  //    user input or a caller bug; THEMES is the source of truth
  //    for what the CSS actually styles.
  //
  // 2. Same theme as current → no-op. Prevents a redundant
  //    `theme-transition` class toggle (which briefly disables
  //    transitions on every animated element) when the user
  //    re-selects the theme they are already on.
  //
  // The previous implementation carried a third guard — a module-
  // level `applying` boolean set/reset synchronously inside this
  // function. It was dead: nothing else could observe the flag
  // because JavaScript is single-threaded and the function never
  // yields between setting and clearing it. The `setTimeout` that
  // removes the transition class runs later, when `applying` is
  // already `false`. Removing it makes the control flow obvious
  // without changing behavior.
  theme = normalizeTheme(theme)
  if (currentTheme.value === theme) return

  document.documentElement.classList.add('theme-transition')
  currentTheme.value = theme
  document.documentElement.setAttribute('data-theme', theme)
  storageService.setItem('theme', theme)

  announceTheme(theme)

  setTimeout(() => {
    document.documentElement.classList.remove('theme-transition')
  }, 350)
}

export function getThemeLabel(theme) {
  return translateTheme(theme)
}

export function loadSavedTheme() {
  const saved = storageService.getItem('theme')
  if (saved) {
    const normalized = normalizeTheme(saved)
    if (currentTheme.value !== normalized) {
      currentTheme.value = normalized
      document.documentElement.setAttribute('data-theme', normalized)
    }
    // Persist the canonical name when migrating the former `light`
    // value, or when recovering from an unknown stored value.
    if (saved !== normalized) storageService.setItem('theme', normalized)
  } else {
    currentTheme.value = DEFAULT_THEME
    document.documentElement.setAttribute('data-theme', DEFAULT_THEME)
  }
}

export function useTheme() {
  const isDark = computed(() => DARK_THEMES.includes(currentTheme.value))

  return {
    currentTheme,
    isDark,
    applyTheme,
    getThemeLabel,
    loadSavedTheme,
    THEMES,
  }
}

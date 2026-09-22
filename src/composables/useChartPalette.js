// frontend/src/composables/useChartPalette.js
import { ref, watch } from 'vue'
import { getChartPalette } from '@/utils/chartPalette'
import { useTheme } from '@/composables/useTheme'


let sharedPaletteRef = null

function readPalette() {
  // SSR guard: getComputedStyle needs a DOM.
  if (typeof window === 'undefined') return []
  const cp = getChartPalette()
  return (cp && cp.series) || []
}

function ensureSharedPalette() {
  if (sharedPaletteRef) return sharedPaletteRef

  sharedPaletteRef = ref(readPalette())

  // Subscribe once to the module-level theme ref. useTheme() returns
  // the same `currentTheme` ref to every caller, so this watcher will
  // fire exactly once per theme change regardless of how many chart
  // components are on the page.
  //
  const { currentTheme } = useTheme()
  watch(currentTheme, () => {
    sharedPaletteRef.value = readPalette()
  })

  return sharedPaletteRef
}

export function useChartPalette() {
  const palette = ensureSharedPalette()

  function refreshPalette() {
    // Force a re-read. Rarely needed now that the theme watcher is in
    // place, but kept for callers that mutate the DOM directly (e.g.
    // tests that stub CSS variables).
    palette.value = readPalette()
  }

  return { palette, refreshPalette }
}
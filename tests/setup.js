// frontend/tests/setup.js
//
// Global test setup.
//
// WHAT LIVES HERE
// ---------------
// Only stubs for browser APIs that happy-dom does not implement but
// that at least one component calls during module load, first
// render, or an `onMounted` hook. Everything else — localStorage,
// sessionStorage, fetch, matchMedia — happy-dom provides natively
// as of the version this project pins.
//
// WHY SO SMALL
// ------------
// A large setup file becomes a second, undocumented runtime. Any
// behaviour a test relies on that is provided by setup.js is
// behaviour the production code does not actually have. Keep this
// file to the smallest set of shims needed for module load and
// first render, and push real behaviour into the test that needs
// it.

import { vi } from 'vitest'

// ── IntersectionObserver ──────────────────────────────────────────
//
// Used by `components/charts/ChartCard.vue` to defer the Chart.js
// render until the canvas scrolls into view. happy-dom does not
// implement it, and the component calls `new IntersectionObserver`
// during `onMounted`.
globalThis.IntersectionObserver = class IntersectionObserver {
  constructor(callback) {
    this._callback = callback
  }
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return [] }
}

// ── ResizeObserver ────────────────────────────────────────────────
//
// Chart.js registers a ResizeObserver on its container when the
// responsive option is on, and a few layout components observe their
// own size. happy-dom does not ship it.
globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// ── matchMedia ────────────────────────────────────────────────────
//
// Used by `features/questions/components/FilterBar.vue` to decide
// whether to start the filter panel collapsed, and by
// `composables/useMediaQuery.js` for responsive branches. The guard
// avoids clobbering a working implementation.
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),      // legacy, still called by some code
    removeListener: vi.fn(),   // legacy
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

// ── window.scrollTo ───────────────────────────────────────────────
//
// `components/common/ScrollToTop.vue` calls it on click.
if (typeof window !== 'undefined') {
  window.scrollTo = vi.fn()
}

// ── Element.prototype.scrollIntoView ──────────────────────────────
//
// The exam runner scrolls the active question into view; the
// preferences page scrolls to an anchor on language change.
// happy-dom implements `scrollIntoView` as a no-op that logs, so
// replacing it with a silent spy keeps the test output clean.
if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = vi.fn()
} else if (typeof Element !== 'undefined') {
  Element.prototype.scrollIntoView = vi.fn()
}

// ── URL.createObjectURL / revokeObjectURL ─────────────────────────
//
// Used by `components/common/ExportButtons.vue` and the question
// image preview in `features/questions/components/QuestionForm.vue`.
// happy-dom provides these on recent versions, but on older ones
// they are missing; the guard keeps the stub from clobbering a real
// implementation.
if (typeof URL !== 'undefined') {
  if (typeof URL.createObjectURL !== 'function') {
    URL.createObjectURL = vi.fn(() => 'blob:test')
  }
  if (typeof URL.revokeObjectURL !== 'function') {
    URL.revokeObjectURL = vi.fn()
  }
}
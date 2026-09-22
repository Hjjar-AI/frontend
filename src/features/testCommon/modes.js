// frontend/src/features/testCommon/modes.js
//
// Mode metadata for the two test engines.
//
// SHAPE
// -----
// Each mode object still carries the same five keys the results and
// question pages read:
//
//   • resultsTitleKey — TestResults.vue
//   • retryLabelKey   — TestResults.vue
//   • showTime        — TestResultsPage.vue, TestQuestion.vue
//   • showShare       — TestResultsPage.vue
//   • overtime        — TestQuestion.vue (Timer prop)
//
// Plus `id`, which is stored on the mode for logging/debugging.
//
// HOISTED SHARED DEFAULTS
// -----------------------
// `retryLabelKey`, `showTime`, and `showShare` were previously
// declared identically on BOTH modes — three lines duplicated per
// mode, six lines total. They now live in a `BASE` object that each
// mode spreads. The two mode-specific keys (`resultsTitleKey`,
// `overtime`) stay where they are because they actually differ.
//
// This is a pure refactor: every consumer reads the same key names
// off the same objects. Do NOT introduce a mode-varying behaviour
// without adding a corresponding key to the mode object — the base
// spread is not a place for mode-specific overrides.

const BASE = {
  retryLabelKey: 'tests.retryLabel',
  showTime: true,
  showShare: false,
}

export const MODES = {
  exam: {
    ...BASE,
    id: 'exam',
    resultsTitleKey: 'tests.examResultsTitle',
    overtime: false,
  },
  study: {
    ...BASE,
    id: 'study',
    resultsTitleKey: 'tests.studyResultsTitle',
    // study counts down, then — instead of auto-finishing — keeps
    // counting UP as an overtime stopwatch.
    overtime: true,
  },
}

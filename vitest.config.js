// frontend/vitest.config.js
//
// Vitest configuration.
//
// WHY A SEPARATE FILE THAT MERGES vite.config.js
// ---------------------------------------------
// The production build and the test run must agree on three things:
//
//   • the `@` → `./src` alias, because every source file imports
//     through it;
//   • the three Vite plugins (`vue`, `AutoImport`, `Components`),
//     because `useI18n`, `useI18n`, `useDirection` and every
//     `Base*` component are auto-injected at compile time and a
//     test that does not run the plugin pipeline would see
//     "useI18n is not defined" from every component;
//   • the manual-chunk map (harmless in tests, but keeping one
//     source of truth avoids drift).
//
// Duplicating any of those in a standalone Vitest config would be a
// second copy that has to be kept in sync by hand. `mergeConfig`
// lets the test config add test-only keys (`test`, `coverage`) on
// top of the production config without touching it.

import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.js'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      // happy-dom is a Node-side DOM implementation. It is faster
      // to boot than jsdom and implements every API this app's
      // components touch during import: `document`, `window`,
      // `localStorage`, `matchMedia` (via the setup stub), and
      // `IntersectionObserver` (via the setup stub).
      environment: 'happy-dom',

      // Globals (`describe`, `it`, `expect`, `vi`) are auto-injected
      // so individual test files do not need the `import { describe
      // } from 'vitest'` line. This matches the `AutoImport`
      // philosophy the app already uses for Vue.
      globals: true,

      // Test file glob. Only files under tests/ are collected;
      // source files never carry co-located tests in this project.
      include: ['tests/**/*.{test,spec}.{js,vue}'],

      // Global stubs for browser APIs happy-dom does not implement.
      setupFiles: ['./tests/setup.js'],

      coverage: {
        provider: 'v8',
        reporter: ['text', 'html', 'lcov'],
        include: ['src/**/*.{js,vue}'],
        exclude: [
          'src/**/*.d.ts',
          'src/main.js',
          // The router file itself is exercised by the guard test,
          // not by unit tests; excluding it here keeps the coverage
          // number meaningful.
          'src/router/index.js',
          // Pure data files. They are checked structurally by the
          // i18n-keys test, not by line coverage.
          'src/i18n/content/**',
          'src/i18n/locales/**',
          'src/**/*.config.js',
        ],
      },
    },
  }),
)
// frontend/vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    vue(),
    AutoImport({
      // 'vue-i18n' preset auto-imports `useI18n`, `i18n`, and the
      // `$t` / `$tc` / `$d` / `$n` template helpers into every SFC.
      // Without it, every migrated component would need an explicit
      // `import { useI18n } from 'vue-i18n'` line — a lot of churn
      // across ~100 files for no benefit.
      imports: ['vue', 'vue-router', 'pinia', 'vue-i18n'],

      dirs: ['src/composables'],

      dts: 'src/autoImports.d.ts',
      eslintrc: { enabled: false },
    }),
    Components({
      dirs: [
        'src/components/base',
        'src/components/common',
        'src/components/charts',
        'src/components/markdown',
        'src/components/layout',
        // Added during the exam/study merge so any component placed
        // in components/cases/ is auto-importable by tag name. Kept
        // for consistency with the other buckets.
        'src/components/cases',
      ],
      dts: 'src/components.d.ts',
      extensions: ['vue'],
      deep: true,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5004', // Django dev server
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        // ── Manual chunk strategy ─────────────────────────────────
        //
        // Split the previous single `vendor` chunk into:
        //
        //   • vendor-vue-core  — the Vue runtime itself.
        //   • vendor-vue-app   — the framework meta-package and the
        //                        plugins that ride on top of it.
        //   • vendor-axios     — HTTP client.
        //   • vendor-chart     — Chart.js and its dependencies.
        //   • vendor-markdown  — markdown-it and DOMPurify.
        //   • vendor-sanitizer — reserved for future sanitizer-only
        //                        splits (currently empty).
        //   • vendor-misc      — anything else in node_modules that
        //                        did not match a category above.
        //
        // WHY SPLIT
        // ---------
        // The Vue runtime changes only on a framework upgrade; the
        // app-layer plugins change more often. Splitting them means a
        // user who has already visited the app keeps the runtime
        // chunk cached across a deploy that bumps vue-router or pinia
        // — a few dozen KB they no longer re-download.
        //
        // PATH MATCHING
        // -------------
        // The matching uses substring checks against the full module
        // id, which includes the pnpm-style path
        //   .../node_modules/.pnpm/<pkg>@<ver>/node_modules/<pkg>/...
        // The `/pkg/` shape matches both the top-level and the
        // pnpm-nested locations, because both contain `/pkg/` as a
        // path segment.
        //
        // Note on `/vue/`: the string `/vue/` matches the bare `vue`
        // package (`node_modules/vue/dist/...`) but not `vue-router`,
        // `vue-i18n`, or `@vue/*` — those have a dash, `@`, or slash
        // between `vue` and the next segment. Each is matched by its
        // own rule below.
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          // ── Vue runtime core ──────────────────────────────────
          // The smallest set of packages every Vue render pulls in.
          // Changes least often; cached longest.
          if (
            id.includes('/@vue/runtime-core/') ||
            id.includes('/@vue/runtime-dom/') ||
            id.includes('/@vue/reactivity/') ||
            id.includes('/@vue/shared/') ||
            id.includes('/@vue/compiler-dom/') ||
            id.includes('/@vue/compiler-core/') ||
            id.includes('/@vue/compiler-ssr/')
          ) {
            return 'vendor-vue-core'
          }

          // ── Vue ecosystem app layer ───────────────────────────
          // The `vue` meta-package and the plugins. Loading order is
          // handled by Rollup's dependency graph — the emitted HTML
          // modulepreloads both chunks in the right order.
          if (
            id.includes('/vue/') ||
            id.includes('/vue-router/') ||
            id.includes('/pinia/') ||
            id.includes('/vue-i18n/')
          ) {
            return 'vendor-vue-app'
          }

          // ── Feature libraries ─────────────────────────────────
          if (id.includes('/axios/')) return 'vendor-axios'
          if (id.includes('/chart.js/')) return 'vendor-chart'
          if (id.includes('/markdown-it/')) return 'vendor-markdown'
          if (id.includes('/dompurify/')) return 'vendor-sanitizer'

          return 'vendor-misc'
        },
      },
    },
  },
})

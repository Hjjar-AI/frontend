// frontend/tests/helpers/componentCorpus.js

import { describe, it, expect, beforeAll } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'

import ar from '@/i18n/locales/ar/index.js'
import en from '@/i18n/locales/en/index.js'

// Every `.vue` file in the project, resolved at module load.
const componentModules = import.meta.glob('/src/**/*.vue')
const ALL_PATHS = Object.keys(componentModules).sort()

// ── Heavy-component list ──────────────────────────────────────────
//
// Populate this from the timing output. A component belongs here if
// it repeatedly appears in the top five slowest mounts across
// multiple runs. Do not add components speculatively — the whole
// point of the two-tier split is that the list reflects measured
// cost, not suspicion.
//
// The list is empty on a clean checkout, so the first run makes no
// assumption about which components are heavy. After the first run,
// add the outliers that appear at the top of more than one shard's
// output (the same component cannot appear in two shards, but a
// pattern of similar components — every `layout/*.vue`, every
// `charts/*.vue` — is what you are looking for).
const HEAVY_COMPONENTS = new Set([
  // Example entries. Remove the leading `//` and fill in the paths
  // once the timing output names them:
  //
  // '/src/components/charts/ChartCard.vue',
  // '/src/components/dashboard/StudyActivityHeatmap.vue',
  // '/src/components/layout/Navbar.vue',
])

// A leaf component is one under `components/` or
// `features/*/components/`. Views under `features/*/views/` are
// covered by the import pass only.
const LEAF_PATTERNS = [
  /\/src\/components\//,
  /\/src\/features\/[^/]+\/components\//,
]
function isLeafComponent(path) {
  return LEAF_PATTERNS.some((re) => re.test(path))
}

// ── Prop generation ───────────────────────────────────────────────

function defaultValueFor(propType) {
  if (propType === String) return ''
  if (propType === Number) return 0
  if (propType === Boolean) return false
  if (propType === Array) return []
  if (propType === Object) return {}
  if (propType === Function) return () => {}
  if (propType === Date) return new Date()
  return undefined
}

function buildMinimalProps(component) {
  const declared = component.props || {}
  const out = {}
  for (const [name, options] of Object.entries(declared)) {
    if (!options || typeof options !== 'object') continue
    if (options.required !== true) continue
    if ('default' in options) continue

    const types = Array.isArray(options.type) ? options.type : [options.type]
    let value
    for (const T of types) {
      value = defaultValueFor(T)
      if (value !== undefined) break
    }
    out[name] = value
  }
  return out
}

// ── Shard assignment ──────────────────────────────────────────────

function pathsForShard(shardIndex, shardCount) {
  const heavy = ALL_PATHS.filter((p) => HEAVY_COMPONENTS.has(p))
  const light = ALL_PATHS.filter((p) => !HEAVY_COMPONENTS.has(p))

  // Heavy: chunked rather than modulo, so each shard gets a
  // contiguous block. Two adjacent heavy components rarely cost the
  // same, so a contiguous block is fine here; what matters is that
  // no single shard gets more than its share.
  const heavyPerShard = Math.ceil(heavy.length / shardCount)
  const myHeavy = heavy.slice(
    shardIndex * heavyPerShard,
    (shardIndex + 1) * heavyPerShard,
  )

  // Light: modulo over the remainder.
  const myLight = light.filter((_, i) => i % shardCount === shardIndex)

  return [...myHeavy, ...myLight]
}

// ── Public entry point ────────────────────────────────────────────

export function runComponentCorpusTest(shardIndex, shardCount) {
  const myPaths = pathsForShard(shardIndex, shardCount)
  const myModules = Object.fromEntries(myPaths.map((p) => [p, componentModules[p]]))

  const i18n = createI18n({
    legacy: false,
    globalInjection: true,
    locale: 'ar',
    fallbackLocale: 'en',
    messages: { ar, en },
    missingWarn: false,
    fallbackWarn: false,
  })

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'Dashboard', component: { template: '<div/>' } },
      { path: '/login', name: 'Login', component: { template: '<div/>' } },
      { path: '/questions', name: 'QuestionsList', component: { template: '<div/>' } },
      { path: '/questions/edit/:id', name: 'QuestionEdit', component: { template: '<div/>' } },
      { path: '/exam', name: 'ExamSetup', component: { template: '<div/>' } },
      { path: '/study', name: 'TestSetup', component: { template: '<div/>' } },
      { path: '/master-exams', name: 'MasterExamsList', component: { template: '<div/>' } },
      { path: '/admin/users', name: 'AdminUsers', component: { template: '<div/>' } },
      { path: '/:pathMatch(.*)*', name: 'NotFound', component: { template: '<div/>' } },
    ],
  })

  describe(`component corpus — shard ${shardIndex + 1} of ${shardCount}`, () => {
    const loaded = new Map()

    beforeAll(async () => {
      await Promise.all(
        Object.entries(myModules).map(async ([path, load]) => {
          try {
            const mod = await load()
            loaded.set(path, { ok: true, mod })
          } catch (e) {
            loaded.set(path, { ok: false, err: e })
          }
        }),
      )
    }, 30_000)

    it('every .vue file imports without throwing and exports a component', () => {
      const failures = []
      for (const [path, entry] of loaded) {
        if (!entry.ok) {
          failures.push(`${path}: import threw — ${entry.err.message}`)
          continue
        }
        if (!entry.mod || !('default' in entry.mod)) {
          failures.push(`${path}: no default export`)
          continue
        }
        const t = typeof entry.mod.default
        if (t !== 'object' && t !== 'function') {
          failures.push(`${path}: default export is ${t}, expected object or function`)
        }
      }
      expect(
        failures,
        `\nBroken components (shard ${shardIndex + 1}):\n  ${failures.join('\n  ')}\n`,
      ).toEqual([])
    })

    it('every leaf component mounts without throwing', () => {
      const failures = []
      const timings = []

      for (const [path, entry] of loaded) {
        if (!entry.ok) continue
        if (!isLeafComponent(path)) continue

        const Comp = entry.mod.default
        const props = buildMinimalProps(Comp)

        // Fresh Pinia per component. Without this, a store fetched
        // during one component's `onMounted` leaks into the next and
        // makes the failures order-dependent.
        setActivePinia(createPinia())

        const start = performance.now()
        let wrapper = null
        try {
          wrapper = shallowMount(Comp, {
            props,
            global: { plugins: [i18n, router] },
          })
          timings.push({ path, ms: performance.now() - start })
        } catch (e) {
          timings.push({ path, ms: performance.now() - start, failed: true })
          failures.push(`${path}: ${e.message}`)
        } finally {
          try { if (wrapper) wrapper.unmount() } catch { /* ignore */ }
        }
      }

      // Diagnostic: print the shard's total mount time and the five
      // slowest components. This is what makes a future rebalance
      // data-driven. The output goes to stderr and is visible in the
      // Vitest run.
      timings.sort((a, b) => b.ms - a.ms)
      const totalMs = timings.reduce((s, t) => s + t.ms, 0)
      const header =
        `[shard ${shardIndex + 1}/${shardCount}] ` +
        `${timings.length} components mounted in ${totalMs.toFixed(0)}ms`
      const lines = timings
        .slice(0, 5)
        .map((t) => `    ${t.ms.toFixed(1).padStart(7)}ms  ${t.path}`)
      // eslint-disable-next-line no-console
      console.log([header, ...lines].join('\n'))

      expect(
        failures,
        `\nComponents that failed to mount (shard ${shardIndex + 1}):\n  ${failures.join('\n  ')}\n`,
      ).toEqual([])
    }, 30_000)
  })
}
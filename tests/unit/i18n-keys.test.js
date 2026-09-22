// frontend/tests/unit/i18n-keys.test.js
//
// Static coverage test for i18n keys.
//
// WHAT THIS FILE CHECKS
// ---------------------
//   1. Every literal `t('…')` / `safeT('…')` key that appears
//      anywhere under `src/` exists in the Arabic catalog.
//   2. The same key exists in the English catalog.
//   3. The two catalogs have exactly the same key set.
//   4. Every `t(\`prefix.${x}\`)` call site uses a prefix on an
//      explicit allowlist, so a new dynamic call site is a conscious
//      decision rather than a silent blind spot.
//
// WHY STATIC AND NOT RENDER-AND-ASSERT
// ------------------------------------
// A component test only exercises the branches it renders. Most of
// the i18n bugs in this class land on cold branches — error toasts,
// empty states, rarely-opened modals. A static scan reaches every
// key in the codebase in one pass.

import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'

import arCatalog from '@/i18n/locales/ar/index.js'
import enCatalog from '@/i18n/locales/en/index.js'

// The correct derivation is `process.cwd()`. Vitest runs with the
// working directory set to the project root (the directory that
// contains `vitest.config.js`), which is `frontend/`. `resolve` then
// builds the absolute path to `frontend/src` without depending on
// how the test file itself was loaded.

const SRC_ROOT = resolve(process.cwd(), 'src')

function* walkSourceFiles(dir) {
  let entries
  try {
    entries = readdirSync(dir)
  } catch {
    return
  }

  for (const entry of entries) {
    // Skip the i18n directory itself. Its files contain catalog
    // values, not key references, and walking it would produce
    // thousands of false positives.
    if (entry === 'i18n') continue

    const full = join(dir, entry)
    let stat
    try {
      stat = statSync(full)
    } catch {
      continue
    }

    if (stat.isDirectory()) {
      yield* walkSourceFiles(full)
    } else if (/\.(js|vue)$/.test(entry)) {
      yield full
    }
  }
}

// ── Key extraction ────────────────────────────────────────────────

const LITERAL_KEY_RE =
  /\b(?:t|safeT)\s*\(\s*(['"`])([^'"`$\\]+)\1/g

const DYNAMIC_PREFIX_RE =
  /\b(?:t|safeT)\s*\(\s*`([^`]*)\$\{/g

const EXPECTED_DYNAMIC_PREFIXES = new Set([
  'about.features.',
  'about.team.',
  'about.tech.',
  'about.tech.items.',
  'about.stats.',
  'about.a11y.',
  'about.contact.',
  'admin.permissions.capability.',
  'theme.',
])

function extractKeysAndPrefixes() {
  const literals = new Map()
  const dynamic = new Map()

  for (const file of walkSourceFiles(SRC_ROOT)) {
    const rel = relative(SRC_ROOT, file).replace(/\\/g, '/')

    let text
    try {
      text = readFileSync(file, 'utf8')
    } catch {
      continue
    }

    const lines = text.split('\n')
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const where = `${rel}:${i + 1}`

      for (const m of line.matchAll(LITERAL_KEY_RE)) {
        const key = m[2]
        if (!key) continue
        if (!literals.has(key)) literals.set(key, new Set())
        literals.get(key).add(where)
      }

      for (const m of line.matchAll(DYNAMIC_PREFIX_RE)) {
        const prefix = m[1]
        if (!prefix) continue
        if (!dynamic.has(prefix)) dynamic.set(prefix, new Set())
        dynamic.get(prefix).add(where)
      }
    }
  }

  return { literals, dynamic }
}

// ── Catalog flattening ─────────────────────────────────────────────

function flattenKeys(obj, prefix = '') {
  const out = new Set()
  for (const [k, v] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${k}` : k
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      for (const nested of flattenKeys(v, full)) out.add(nested)
    } else {
      out.add(full)
    }
  }
  return out
}

// ── Tests ──────────────────────────────────────────────────────────

describe('i18n catalog coverage', () => {
  const arKeys = flattenKeys(arCatalog)
  const enKeys = flattenKeys(enCatalog)
  const { literals, dynamic } = extractKeysAndPrefixes()

  it('sanity: the source scan found a non-trivial number of keys', () => {
    expect(literals.size).toBeGreaterThan(100)
  })

  it('every literal t() key exists in the ar catalog', () => {
    const missing = []
    for (const [key, whereSet] of literals) {
      if (arKeys.has(key)) continue
      for (const where of whereSet) missing.push(`${key}  (${where})`)
    }
    expect(
      missing,
      `\nMissing ar keys:\n  ${missing.join('\n  ')}\n`,
    ).toEqual([])
  })

  it('every literal t() key exists in the en catalog', () => {
    const missing = []
    for (const [key, whereSet] of literals) {
      if (enKeys.has(key)) continue
      for (const where of whereSet) missing.push(`${key}  (${where})`)
    }
    expect(
      missing,
      `\nMissing en keys:\n  ${missing.join('\n  ')}\n`,
    ).toEqual([])
  })

  it('ar and en catalogs have the same key set', () => {
    const onlyInAr = [...arKeys].filter((k) => !enKeys.has(k)).sort()
    const onlyInEn = [...enKeys].filter((k) => !arKeys.has(k)).sort()
    expect(
      { onlyInAr, onlyInEn },
      `\n  only in ar: ${onlyInAr.join(', ') || '(none)'}\n` +
      `  only in en: ${onlyInEn.join(', ') || '(none)'}\n`,
    ).toEqual({ onlyInAr: [], onlyInEn: [] })
  })

  it('every dynamic t() prefix is on the expected list', () => {
    const unexpected = [...dynamic.keys()]
      .filter((p) => !EXPECTED_DYNAMIC_PREFIXES.has(p))
      .sort()
    expect(
      unexpected,
      `\nUnexpected dynamic t() prefixes:\n` +
      `  ${unexpected.join('\n  ')}\n\n` +
      `Add each prefix to EXPECTED_DYNAMIC_PREFIXES after verifying\n` +
      `the expansions exist in both catalogs, or convert the call\n` +
      `site to a literal key.\n`,
    ).toEqual([])
  })
})
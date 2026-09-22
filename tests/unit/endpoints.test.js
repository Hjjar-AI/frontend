// frontend/tests/unit/endpoints.test.js
//
// Shape test for the ENDPOINTS registry.
//
// WHAT THIS GUARDS AGAINST
// ------------------------
//   1. A call site that references a constant the registry does not
//      define. The `questionService.updateCaseStem` bug used
//      `CASE_STEM` when the registry defines `CASES_STEM`; the
//      missing value was `undefined`, so the call threw at the call
//      site rather than at startup.
//
//   2. A builder that produces a malformed path — missing leading
//      slash, doubled slash, or an interpolation of a `undefined`
//      argument.

import { describe, it, expect } from 'vitest'

import { ENDPOINTS, API_BASE } from '@/services/api/endpoints'

const DUMMY_ARG = 1

// ── Registry walk ──────────────────────────────────────────────────

function walk(node, path = 'ENDPOINTS') {
  if (typeof node === 'string') {
    return [{ path, kind: 'string', value: node }]
  }
  if (typeof node === 'function') {
    return [{ path, kind: 'function', value: node }]
  }
  if (node !== null && typeof node === 'object') {
    return Object.entries(node).flatMap(([k, v]) => walk(v, `${path}.${k}`))
  }
  return [{ path, kind: 'other', value: node }]
}

const leaves = walk(ENDPOINTS)

// ── Shape assertions ───────────────────────────────────────────────

describe('ENDPOINTS registry shape', () => {
  it('every leaf is either a string or a function', () => {
    const bad = leaves
      .filter((l) => l.kind === 'other')
      .map((l) => `${l.path} = ${typeof l.value}`)
    expect(bad, `\n  ${bad.join('\n  ')}\n`).toEqual([])
  })

  it('every string leaf starts with a single slash', () => {
    const bad = leaves
      .filter((l) => l.kind === 'string')
      .filter((l) => !l.value.startsWith('/') || l.value.startsWith('//'))
      .map((l) => `${l.path} = ${JSON.stringify(l.value)}`)
    expect(bad, `\n  ${bad.join('\n  ')}\n`).toEqual([])
  })

  it('every string leaf ends with a slash', () => {
    const bad = leaves
      .filter((l) => l.kind === 'string')
      .filter((l) => !l.value.endsWith('/'))
      .map((l) => `${l.path} = ${JSON.stringify(l.value)}`)
    expect(bad, `\n  ${bad.join('\n  ')}\n`).toEqual([])
  })

  it('every builder returns a well-formed path when called with dummy arguments', () => {

    const failures = []
    for (const leaf of leaves) {
      if (leaf.kind !== 'function') continue

      const arity = leaf.value.length
      const args = arity === 0 ? [] : new Array(arity).fill(DUMMY_ARG)

      let result
      try {
        result = leaf.value(...args)
      } catch (e) {
        failures.push(`${leaf.path}(${args.join(',')}) threw: ${e.message}`)
        continue
      }

      if (typeof result !== 'string') {
        failures.push(`${leaf.path}(${args.join(',')}) returned ${typeof result}, not a string`)
        continue
      }
      if (!result.startsWith('/')) {
        failures.push(`${leaf.path}(${args.join(',')}) = ${JSON.stringify(result)} — missing leading slash`)
      }
      if (result.startsWith('//')) {
        failures.push(`${leaf.path}(${args.join(',')}) = ${JSON.stringify(result)} — double leading slash`)
      }
      if (result.includes('undefined') || result.includes('null')) {
        failures.push(
          `${leaf.path}(${args.join(',')}) = ${JSON.stringify(result)} ` +
          `— interpolated a non-string argument (arity ${arity})`,
        )
      }
    }
    expect(failures, `\n  ${failures.join('\n  ')}\n`).toEqual([])
  })

  it('no two leaves share a fully-qualified path', () => {
    const paths = leaves.map((l) => l.path)
    const dupes = paths.filter((p, i) => paths.indexOf(p) !== i)
    expect([...new Set(dupes)]).toEqual([])
  })
})

// ── Named regression guards ────────────────────────────────────────

describe('high-risk constants', () => {
  it('QUESTIONS.CASES_STEM is a builder (regression guard for the CASE_STEM misspelling)', () => {
    expect(typeof ENDPOINTS.QUESTIONS.CASES_STEM).toBe('function')
    expect(ENDPOINTS.QUESTIONS.CASES_STEM('case-foo'))
      .toBe('/questions/case/case-foo/stem/')
  })

  it('QUESTIONS.CASES_DETAIL is a builder', () => {
    expect(typeof ENDPOINTS.QUESTIONS.CASES_DETAIL).toBe('function')
    expect(ENDPOINTS.QUESTIONS.CASES_DETAIL('case-foo'))
      .toBe('/questions/cases/case-foo/')
  })

  it('QUESTIONS.RATINGS_BATCH is a plain string', () => {
    expect(typeof ENDPOINTS.QUESTIONS.RATINGS_BATCH).toBe('string')
    expect(ENDPOINTS.QUESTIONS.RATINGS_BATCH).toBe('/questions/ratings/')
  })

  it('QUESTIONS.STUDY_NOW is a plain string', () => {
    expect(typeof ENDPOINTS.QUESTIONS.STUDY_NOW).toBe('string')
    expect(ENDPOINTS.QUESTIONS.STUDY_NOW).toBe('/questions/study-now/')
  })

  it('MASTER_EXAMS.RESULTS_SUMMARY_CSV is a builder', () => {
    expect(typeof ENDPOINTS.MASTER_EXAMS.RESULTS_SUMMARY_CSV).toBe('function')
    expect(ENDPOINTS.MASTER_EXAMS.RESULTS_SUMMARY_CSV(42))
      .toBe('/exam/master/42/results/summary.csv/')
  })

  it('DATABASE.EXPORT_STATE is a plain string', () => {
    expect(typeof ENDPOINTS.DATABASE.EXPORT_STATE).toBe('string')
    expect(ENDPOINTS.DATABASE.EXPORT_STATE).toBe('/database/export/state/')
  })

  it('GROUPS.ADMIN_MEMBER takes two arguments (regression guard)', () => {
 
    expect(typeof ENDPOINTS.GROUPS.ADMIN_MEMBER).toBe('function')
    expect(ENDPOINTS.GROUPS.ADMIN_MEMBER.length).toBe(2)
    expect(ENDPOINTS.GROUPS.ADMIN_MEMBER(5, 42))
      .toBe('/study/admin/groups/5/members/42/')
  })

  it('API_BASE starts with a slash and does not end with one', () => {
    expect(API_BASE).toMatch(/^\//)
    expect(API_BASE.endsWith('/')).toBe(false)
  })
})
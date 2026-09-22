// frontend/tests/unit/composables/usePagination.test.js
//
// Tests for the pagination state machine.
//
// CLAMPING CONTRACT
// -----------------
// `goToPage(n)` clamps `n` to `[1, totalPages.value]`. `totalPages`
// derives from `total.value` and `perPage.value` and has a minimum
// of 1 — an empty list still has exactly one (empty) page. A test
// that wants to observe `page.value === 3` after `goToPage(3)` must
// therefore set `total.value` high enough that `totalPages >= 3`.

import { describe, it, expect, vi } from 'vitest'
import { usePagination } from '@/composables/usePagination'

describe('usePagination', () => {
  it('starts on page 1 with the given perPage', () => {
    const { page, perPage, total, totalPages } = usePagination(null, 20)
    expect(page.value).toBe(1)
    expect(perPage.value).toBe(20)
    expect(total.value).toBe(0)
    expect(totalPages.value).toBe(1)
  })

  it('defaults perPage to 20', () => {
    const { perPage } = usePagination(null)
    expect(perPage.value).toBe(20)
  })

  it('goToPage changes page and calls the fetch function', async () => {
    const fetchFn = vi.fn()
    const { page, total, goToPage } = usePagination(fetchFn, 20)
    // Give the paginator enough pages for page 3 to be reachable.
    total.value = 100  // ceil(100 / 20) = 5
    await goToPage(3)
    expect(page.value).toBe(3)
    expect(fetchFn).toHaveBeenCalledTimes(1)
  })

  it('goToPage clamps to the lower bound of 1', async () => {
    const fetchFn = vi.fn()
    const { page, goToPage } = usePagination(fetchFn, 20)
    await goToPage(-5)
    expect(page.value).toBe(1)
  })

  it('goToPage clamps to the upper bound of totalPages', async () => {
    const fetchFn = vi.fn()
    const { page, total, goToPage } = usePagination(fetchFn, 20)
    total.value = 100
    await goToPage(999)
    expect(page.value).toBe(5)
  })

  it('changePerPage updates perPage and resets to page 1', async () => {
    const fetchFn = vi.fn()
    const { page, perPage, total, changePerPage } = usePagination(fetchFn, 20)
    total.value = 200
    page.value = 4
    await changePerPage(50)
    expect(perPage.value).toBe(50)
    expect(page.value).toBe(1)
    expect(fetchFn).toHaveBeenCalledTimes(1)
  })

  it('totalPages reflects total / perPage, with a minimum of 1', () => {
    const { total, perPage, totalPages } = usePagination(null, 20)
    total.value = 40
    expect(totalPages.value).toBe(2)
    total.value = 0
    expect(totalPages.value).toBe(1)
    total.value = 21
    expect(totalPages.value).toBe(2)
    // perPage change is reflected immediately.
    perPage.value = 10
    expect(totalPages.value).toBe(3)
  })

  it('reset returns page, perPage and total to their defaults', () => {
    const { page, perPage, total, reset } = usePagination(null, 50)
    page.value = 3
    perPage.value = 10
    total.value = 100
    reset()
    expect(page.value).toBe(1)
    expect(perPage.value).toBe(50)
    expect(total.value).toBe(0)
  })

  it('goToPage without a fetch function does not throw', async () => {
    const { page, total, goToPage } = usePagination(null, 20)
    total.value = 100
    await expect(goToPage(2)).resolves.toBeUndefined()
    expect(page.value).toBe(2)
  })
})
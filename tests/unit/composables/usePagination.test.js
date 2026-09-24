// frontend/tests/unit/composables/usePagination.test.js
//
// Tests for the pagination state machine.
//
// CLAMPING CONTRACT
// -----------------
// `goToPage(n)` clamps `n` to `[1, totalPages.value]`. `totalPages`
// is supplied by the server response, so tests set it explicitly.

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
    const { page, totalPages, goToPage } = usePagination(fetchFn, 20)
    totalPages.value = 5
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
    const { page, totalPages, goToPage } = usePagination(fetchFn, 20)
    totalPages.value = 5
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

  it('totalPages accepts the server-provided page count', () => {
    const { totalPages } = usePagination(null, 20)
    totalPages.value = 7
    expect(totalPages.value).toBe(7)
  })

  it('reset returns page, perPage and total to their defaults', () => {
    const { page, perPage, total, totalPages, reset } = usePagination(null, 50)
    page.value = 3
    perPage.value = 10
    total.value = 100
    totalPages.value = 10
    reset()
    expect(page.value).toBe(1)
    expect(perPage.value).toBe(50)
    expect(total.value).toBe(0)
    expect(totalPages.value).toBe(1)
  })

  it('goToPage without a fetch function does not throw', async () => {
    const { page, totalPages, goToPage } = usePagination(null, 20)
    totalPages.value = 5
    await expect(goToPage(2)).resolves.toBeUndefined()
    expect(page.value).toBe(2)
  })
})

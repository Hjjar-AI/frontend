// frontend/tests/unit/composables/useSelection.test.js
import { describe, it, expect } from 'vitest'
import { useSelection } from '@/composables/useSelection'

describe('useSelection', () => {
  it('starts empty', () => {
    const { selectedIds } = useSelection()
    expect(selectedIds.value).toEqual([])
  })

  it('toggle adds an id when it is not selected', () => {
    const { selectedIds, toggle } = useSelection()
    toggle(1)
    expect(selectedIds.value).toEqual([1])
  })

  it('toggle removes an id when it is already selected', () => {
    const { selectedIds, toggle } = useSelection()
    toggle(1)
    toggle(1)
    expect(selectedIds.value).toEqual([])
  })

  it('toggle preserves the order of first selection', () => {
    const { selectedIds, toggle } = useSelection()
    toggle(3)
    toggle(1)
    toggle(2)
    expect(selectedIds.value).toEqual([3, 1, 2])
  })

  it('selectAll replaces the selection', () => {
    const { selectedIds, toggle, selectAll } = useSelection()
    toggle(99)
    selectAll([1, 2, 3])
    expect(selectedIds.value).toEqual([1, 2, 3])
  })

  it('clear empties the selection', () => {
    const { selectedIds, toggle, clear } = useSelection()
    toggle(1)
    toggle(2)
    clear()
    expect(selectedIds.value).toEqual([])
  })

  it('isSelected reflects the current set', () => {
    const { toggle, isSelected } = useSelection()
    toggle(5)
    expect(isSelected(5)).toBe(true)
    expect(isSelected(6)).toBe(false)
  })

  it('each instance holds its own selection', () => {
    // Two consumers calling `useSelection()` at the same time get
    // independent state. Unlike `useDropdown`, `useSelection` is
    // per-instance — a page with two independent multi-select lists
    // does not have them interfere.
    const a = useSelection()
    const b = useSelection()
    a.toggle(1)
    expect(a.selectedIds.value).toEqual([1])
    expect(b.selectedIds.value).toEqual([])
  })
})
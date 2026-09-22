// frontend/src/composables/useSelection.js
import { ref, computed } from 'vue'

export function useSelection() {
  const selectedSet = ref(new Set())

  const selectedIds = computed(() => Array.from(selectedSet.value))

  function toggle(id) {
    const newSet = new Set(selectedSet.value)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    selectedSet.value = newSet
  }

  function selectAll(ids) {
    selectedSet.value = new Set(ids)
  }

  function clear() {
    selectedSet.value = new Set()
  }

  function isSelected(id) {
    return selectedSet.value.has(id)
  }

  return {
    selectedIds,
    toggle,
    selectAll,
    clear,
    isSelected,
  }
}
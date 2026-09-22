// frontend/src/composables/useModalStack.js
//
// Per-instance z-index for nested modals.
//
// WHY THIS EXISTS
// ---------------
// Every `BaseModal` Teleports its overlay to `<body>`. Before this
// change, every overlay used the same fixed z-index
// (`var(--z-modal-overlay)` from tokens.css), so a modal that was
// supposed to render on top of another one only did so because its
// Teleported node happened to be inserted into `<body>` after the
// first one's. That is DOM-insertion-order-dependent, not a
// designed guarantee. A future change that pre-mounts the global
// `AppDialogs` modals (`v-show` instead of `v-if`) would silently
// put a confirm dialog BEHIND the form modal it is confirming.
//
// WHAT IT DOES
// ------------
// A module-level array tracks the currently open modal instances in
// the order they were opened. Each modal gets a computed z-index
// equal to `BASE_Z + index * STEP`, where `index` is its position
// in the array. Opening a new modal pushes it to the end (highest
// z-index); closing one removes it. The indices of the remaining
// modals shift, but their relative order is preserved — the modal
// that was on top stays on top of the modal that was beneath it.
//
// STEP is 2 (not 1) so an overlay and any nested stacking context
// it creates (an absolutely-positioned menu, a tooltip) can use the
// one-less-than-the-next-modal gap without colliding with the next
// modal's overlay.
//
// TIER BOUNDARY
// -------------
// BASE_Z matches `--z-modal-overlay` (1040) in tokens.css. With
// STEP = 2 and a practical nesting ceiling of a handful of modals,
// the highest assigned z-index stays below `--z-modal` (1050), so
// the modal tier never bleeds into the toast tier (`--z-toast`
// 1060) or the tooltip tier (`--z-tooltip` 1070).
//
// USAGE
// -----
//   const { zIndex, register, unregister } = useModalStack()
//
//   watch(() => props.isOpen, (val) => {
//     if (val) register()
//     else unregister()
//   })
//
// The `zIndex` ref is bound directly on the overlay element:
//   :style="{ zIndex: zIndex.value }"

import { ref, computed, onBeforeUnmount } from 'vue'

const BASE_Z = 1040
const STEP = 2

// Module-level stack. Insertion order = visual stacking order.
// Never exported; consumers go through `useModalStack()`.
const openStack = ref([])
let nextId = 0

export function useModalStack() {
  const id = ++nextId

  const zIndex = computed(() => {
    const idx = openStack.value.indexOf(id)
    return idx < 0 ? BASE_Z : BASE_Z + idx * STEP
  })

  function register() {
    if (!openStack.value.includes(id)) {
      // Assign a new array so the computed re-evaluates. Mutating
      // the existing array in place would be tracked by Vue's deep
      // reactive proxy, but a full reassignment keeps the identity
      // change obvious at every call site that reads the stack.
      openStack.value = [...openStack.value, id]
    }
  }

  function unregister() {
    const idx = openStack.value.indexOf(id)
    if (idx >= 0) {
      const next = [...openStack.value]
      next.splice(idx, 1)
      openStack.value = next
    }
  }

  onBeforeUnmount(() => {
    // Safety net: a modal that unmounts without emitting a close
    // (e.g. its parent route is torn down while it is still open)
    // would otherwise leave its id in the stack forever, skewing
    // the z-index of every modal opened afterwards.
    unregister()
  })

  return { zIndex, register, unregister }
}
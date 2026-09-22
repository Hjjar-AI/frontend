// frontend/src/composables/useDropdown.js
//
// Dropdown state machine shared across every menu surface in the app.
//
// SHARED STATE (single-open-at-a-time)
// ------------------------------------
// A module-level `openDropdownId` ref tracks which dropdown (if any)
// is currently open. Each composable instance gets a unique integer
// id at construction; its `isOpen` computed returns true only when
// its own id matches the shared ref. Opening any dropdown sets the
// shared ref to its own id, which atomically closes whichever one
// was open before — no explicit coordination between instances.
//
// This is the same behavior the previous navbar had via a single
// `activeDropdown` string ref, but now extended to every dropdown in
// the app. Clicking the theme switcher closes the language switcher;
// clicking the language switcher closes the user menu; and so on.
//
// FOCUS RETURN
// ------------
// Opening a dropdown records `document.activeElement`. Closing it
// returns focus there. When dropdown A is displaced by dropdown B
// (because B's open() overwrote the shared id), A's close() is not
// called and A's stored focus element is overwritten by B's. That is
// the correct semantics: the element that had focus when B opened
// was B's toggle (the browser moves focus to a clicked button), and
// when B closes, focus returns there — not to A.
//
// OUTSIDE CLICK
// -------------
// `useClickOutside` uses a bubbling-phase listener. Dropdown toggles
// call `event.stopPropagation()` on their click handler, so clicking
// dropdown B's toggle does not fire dropdown A's outside-click
// handler. A simply becomes closed via the shared state change, and
// its stored focus element is left untouched.

import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useClickOutside } from '@/composables/useClickOutside'
import { useFocusReturn } from '@/composables/useFocusReturn'

// Module-level shared state. Never exported — consumers go through
// the composable.
const openDropdownId = ref(null)
let nextDropdownId = 0

export function useDropdown(options = {}) {
  const {
    // Optional predicate. Return true to block open() and toggle().
    // Evaluated lazily on every call so the caller can pass a
    // reactive getter, e.g. `() => props.disabled`.
    isDisabled = () => false,

    // Optional lifecycle callbacks, invoked AFTER the state change.
    // Note: `onClose` does NOT fire when this dropdown is closed by
    // a sibling opening — that path bypasses this instance's close()
    // entirely and only flips the shared ref. If you need a hook
    // that runs on every close (including displacement), watch
    // `isOpen` in the caller.
    onOpen = null,
    onClose = null,
  } = options

  const myId = ++nextDropdownId
  const isOpen = computed(() => openDropdownId.value === myId)
  const rootRef = ref(null)
  const { storeFocus, restoreFocus } = useFocusReturn()

  function open() {
    if (isOpen.value) return
    if (isDisabled()) return
    storeFocus()
    openDropdownId.value = myId
    if (onOpen) onOpen()
  }

  function close() {
    if (!isOpen.value) return
    openDropdownId.value = null
    restoreFocus()
    if (onClose) onClose()
  }

  function toggle() {
    isOpen.value ? close() : open()
  }

  useClickOutside(rootRef, () => {
    if (isOpen.value) close()
  })

  function handleKeydown(event) {
    if (event.key === 'Escape' && isOpen.value) {
      close()
    }
  }

  onMounted(() => {
    document.addEventListener('keydown', handleKeydown)
  })

  onBeforeUnmount(() => {
    document.removeEventListener('keydown', handleKeydown)
    // Release the shared slot if this component owned it. Without
    // this, unmounting an open dropdown would leave `openDropdownId`
    // pointing at a dead instance and block every other dropdown
    // from opening until the user clicks somewhere or presses Escape
    // — and neither of those would work either, because no listener
    // remains to receive them.
    if (openDropdownId.value === myId) {
      openDropdownId.value = null
    }
  })

  return { isOpen, rootRef, open, close, toggle }
}
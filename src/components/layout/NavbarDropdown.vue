<!-- frontend/src/components/layout/NavbarDropdown.vue -->
<!--
  Navbar dropdown with self-managed open state.

  Previously a controlled component: the parent (`Navbar.vue`) held
  an `activeDropdown` string ref and passed `:open` plus listened to
  `@toggle`. That pattern was needed because there was no shared
  registry of "which dropdown is open". Now that `useDropdown()`
  owns a module-level shared ref, this component manages its own
  state and automatically closes its siblings when it opens.

  The `isActive` prop is still accepted — it controls the highlight
  on the toggle button when the current route matches one of the
  dropdown's children.
-->
<template>
  <div class="navbar-dropdown" ref="rootRef">
    <button
      type="button"
      class="nav-link"
      :class="{ 'nav-link--active': isActive }"
      @click.stop="toggle"
      :aria-expanded="isOpen"
      :aria-haspopup="true"
    >
      <i :class="icon"></i>
      <span>{{ label }}</span>
      <i
        class="bi bi-chevron-down navbar-dropdown__arrow"
        :class="{ 'navbar-dropdown__arrow--open': isOpen }"
      ></i>
    </button>
    <Transition name="dropdown">
      <div
        v-show="isOpen"
        class="navbar-dropdown__menu menu-surface"
        @click="handleChildClick"
      >
        <slot />
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { useDropdown } from '@/composables/useDropdown'

defineProps({
  label: { type: String, required: true },
  icon: { type: String, default: '' },
  isActive: { type: Boolean, default: false },
})

const { isOpen, rootRef, close, toggle } = useDropdown()

// Clicking any link or button inside the menu closes it. `closest()`
// handles clicks on the icon inside a link — `e.target` may be the
// <i>, but its closest ancestor is the <a>. This matches the previous
// behavior in the controlled version.
function handleChildClick(e) {
  const target = e.target.closest('a, button')
  if (target && isOpen.value) close()
}
</script>
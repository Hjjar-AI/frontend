<!-- frontend/src/components/base/BaseModal.vue -->
<script>
let modalIdCounter = 0
let openModalCount = 0

// Scroll-lock padding fallback.
//
// The primary compensation for the modal-open layout shift is
// `scrollbar-gutter: stable` on `<html>` in reset.css — it keeps
// the scrollbar gutter reserved at all times so opening a modal
// never changes the content width. This JS variable is the
// fallback for browsers that do not implement `scrollbar-gutter`
// (all evergreen browsers do as of 2026, so this path is
// effectively dead code — kept because it costs nothing and
// protects a browser we have not foreseen).
//
// The lock target is <html>, not <body>. reset.css sets
// `html { overflow-x: hidden }`, which per CSS Overflow 3
// computes the other axis to `auto` — making <html> the scroll
// container for the viewport and DISABLING propagation of
// <body>'s overflow to the viewport. Writing
// `document.body.style.overflow = 'hidden'` therefore had no
// effect on viewport scroll, which is why the lock appeared to
// work (nothing visibly changed) but did not actually prevent
// background scrolling. Writing the lock on <html> applies it to
// the viewport, which is what the modal needs.
let savedHtmlPaddingRight = null
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="base-modal-overlay"
        :class="{ 'base-modal-overlay--static': staticBackdrop }"
        :style="{ zIndex: zIndex }"
        @click.self="handleBackdrop"
      >
        <div
          ref="modalRef"
          class="base-modal"
          :class="[`base-modal--${size}`]"
          :role="role"
          tabindex="-1"
          :aria-modal="true"
          :aria-labelledby="titleId"
          @keydown="handleKeydown"
        >
          <header class="base-modal__header">
            <h2 :id="titleId" class="base-modal__title">
              <slot name="title">{{ title }}</slot>
            </h2>
            <BaseIconButton
              class="base-modal__close"
              icon="bi bi-x"
              variant="ghost"
              size="small"
              :label="t('ui.closeDialog')"
              @click="close"
            />
          </header>
          <div class="base-modal__body">
            <slot />
          </div>
          <footer v-if="$slots.footer" class="base-modal__footer">
            <slot name="footer" />
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, onUnmounted, nextTick } from 'vue'
import { useModalStack } from '@/composables/useModalStack'
import BaseIconButton from './BaseIconButton.vue'

const { t } = useI18n()

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  title: { type: String, default: '' },
  size: { type: String, default: 'md', validator: (v) => ['sm', 'md', 'lg', 'xl'].includes(v) },
  role: { type: String, default: 'dialog' },
  staticBackdrop: { type: Boolean, default: false },
  dismissable: { type: Boolean, default: true },
  initialFocus: { type: [String, Function], default: '' },
})

const emit = defineEmits(['update:isOpen', 'close'])

modalIdCounter++
const titleId = `modal-title-${modalIdCounter}`
const modalRef = ref(null)
let previousActiveElement = null

// Per-instance z-index for nested modals. See the module comment
// in useModalStack.js for the failure mode this replaces.
const { zIndex, register, unregister } = useModalStack()

let contributedToLock = false

function acquireLock() {
  if (contributedToLock) return
  contributedToLock = true
  openModalCount++
  if (openModalCount === 1) {
    // Measure BEFORE touching the inline style. With
    // `scrollbar-gutter: stable` in reset.css the gutter is
    // already reserved, so this delta is normally 0 and the
    // padding compensation below is skipped.
    const before = document.documentElement.clientWidth
    document.documentElement.style.overflow = 'hidden'
    const after = document.documentElement.clientWidth
    if (after > before) {
      // Fallback path for a browser without `scrollbar-gutter`.
      // The vertical scrollbar in every evergreen browser sits
      // on the physical right, so a physical `padding-right`
      // (not a logical inline-end) is the correct side in both
      // LTR and RTL.
      savedHtmlPaddingRight = document.documentElement.style.paddingRight || ''
      document.documentElement.style.paddingRight = `${after - before}px`
    }
  }
}

function releaseLock() {
  if (!contributedToLock) return
  contributedToLock = false
  openModalCount = Math.max(0, openModalCount - 1)
  if (openModalCount === 0) {
    document.documentElement.style.overflow = ''
    if (savedHtmlPaddingRight !== null) {
      document.documentElement.style.paddingRight = savedHtmlPaddingRight
      savedHtmlPaddingRight = null
    }
  }
}

function close() {
  if (!props.dismissable) return
  emit('update:isOpen', false)
  emit('close')
}

function handleBackdrop() {
  if (!props.staticBackdrop) close()
}

function getFocusableElements() {
  if (!modalRef.value) return []
  return Array.from(
    modalRef.value.querySelectorAll(
      'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => element.getAttribute('aria-hidden') !== 'true')
}

function resolveInitialFocus() {
  if (!modalRef.value) return null

  if (typeof props.initialFocus === 'function') {
    const target = props.initialFocus()
    return target?.$el || target || null
  }

  if (props.initialFocus) {
    try {
      const target = modalRef.value.querySelector(props.initialFocus)
      if (target) return target
    } catch {
      // An invalid consumer selector falls back to the safe defaults below.
    }
  }

  return (
    modalRef.value.querySelector('[autofocus], [data-modal-initial-focus]') ||
    modalRef.value.querySelector(
      'input:not(:disabled), select:not(:disabled), textarea:not(:disabled)',
    ) ||
    getFocusableElements()[0] ||
    modalRef.value
  )
}

function handleKeydown(e) {
  if (e.key === 'Escape' && props.dismissable) {
    close()
    return
  }

  if (e.key === 'Tab' && modalRef.value) {
    const focusable = getFocusableElements()
    if (focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault()
        last.focus()
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }
}

watch(
  () => props.isOpen,
  async (val) => {
    if (val) {
      previousActiveElement = document.activeElement
      acquireLock()
      register()

      try {
        await nextTick()
        resolveInitialFocus()?.focus()
      } catch (e) {
        // Focus failed; the lock stays held until close.
      }
    } else {
      unregister()
      releaseLock()
      if (previousActiveElement) {
        previousActiveElement.focus()
        previousActiveElement = null
      }
    }
  },
  { immediate: true }
)

onUnmounted(() => {
  unregister()
  releaseLock()
})
</script>

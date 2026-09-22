// frontend/tests/unit/composables/useDropdown.test.js
//
// Tests for the shared dropdown state machine.
//
// The composable's `openDropdownId` is a module-level ref, so two
// dropdowns in the same test file share it. Each test mounts a
// wrapper and unmounts it, which is what releases the shared slot
// (see the composable's `onBeforeUnmount`).
//
// If a test leaves a dropdown open at the end of the file, the
// `openDropdownId` continues to point at a dead instance. The
// `afterEach` unmount handles this by unmounting every wrapper.

import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'

import { useDropdown } from '@/composables/useDropdown'

const mounted = []

afterEach(() => {
  while (mounted.length) mounted.pop().unmount()
})

function makeWrapper() {
  const wrapper = mount(defineComponent({
    setup() { return useDropdown() },
    render() { return h('div', { ref: 'rootRef' }) },
  }))
  mounted.push(wrapper)
  return wrapper
}

describe('useDropdown — open and close', () => {
  it('starts closed', () => {
    const w = makeWrapper()
    expect(w.vm.isOpen).toBe(false)
  })

  it('open() sets isOpen to true', () => {
    const w = makeWrapper()
    w.vm.open()
    expect(w.vm.isOpen).toBe(true)
  })

  it('close() sets isOpen to false', () => {
    const w = makeWrapper()
    w.vm.open()
    w.vm.close()
    expect(w.vm.isOpen).toBe(false)
  })

  it('toggle() flips the state', () => {
    const w = makeWrapper()
    w.vm.toggle()
    expect(w.vm.isOpen).toBe(true)
    w.vm.toggle()
    expect(w.vm.isOpen).toBe(false)
  })

  it('open() is idempotent when already open', () => {
    const w = makeWrapper()
    w.vm.open()
    const onOpenCalledBefore = w.vm.isOpen
    w.vm.open()
    expect(w.vm.isOpen).toBe(onOpenCalledBefore)
  })
})

describe('useDropdown — single-open invariant', () => {
  it('opening a second dropdown closes the first', () => {
    const w1 = makeWrapper()
    const w2 = makeWrapper()
    w1.vm.open()
    expect(w1.vm.isOpen).toBe(true)
    expect(w2.vm.isOpen).toBe(false)

    w2.vm.open()
    expect(w1.vm.isOpen).toBe(false)
    expect(w2.vm.isOpen).toBe(true)
  })

  it('three dropdowns: only the last opened one is open', () => {
    const w1 = makeWrapper()
    const w2 = makeWrapper()
    const w3 = makeWrapper()

    w1.vm.open()
    w2.vm.open()
    w3.vm.open()

    expect(w1.vm.isOpen).toBe(false)
    expect(w2.vm.isOpen).toBe(false)
    expect(w3.vm.isOpen).toBe(true)
  })
})

describe('useDropdown — isDisabled', () => {
  it('open() is a no-op when isDisabled returns true', () => {
    const wrapper = mount(defineComponent({
      setup() {
        const disabled = ref(true)
        const api = useDropdown({ isDisabled: () => disabled.value })
        return { ...api, disabled }
      },
      render() { return h('div', { ref: 'rootRef' }) },
    }))
    mounted.push(wrapper)

    wrapper.vm.open()
    expect(wrapper.vm.isOpen).toBe(false)
  })

  it('toggle() respects isDisabled', () => {
    const wrapper = mount(defineComponent({
      setup() {
        const api = useDropdown({ isDisabled: () => true })
        return { ...api }
      },
      render() { return h('div', { ref: 'rootRef' }) },
    }))
    mounted.push(wrapper)

    wrapper.vm.toggle()
    expect(wrapper.vm.isOpen).toBe(false)
  })
})

describe('useDropdown — lifecycle callbacks', () => {
  it('onOpen fires when the dropdown opens', () => {
    const onOpen = vi.fn()
    const wrapper = mount(defineComponent({
      setup() { return useDropdown({ onOpen }) },
      render() { return h('div', { ref: 'rootRef' }) },
    }))
    mounted.push(wrapper)

    wrapper.vm.open()
    expect(onOpen).toHaveBeenCalledTimes(1)
  })

  it('onClose fires when the dropdown closes via its own close()', () => {
    const onClose = vi.fn()
    const wrapper = mount(defineComponent({
      setup() { return useDropdown({ onClose }) },
      render() { return h('div', { ref: 'rootRef' }) },
    }))
    mounted.push(wrapper)

    wrapper.vm.open()
    wrapper.vm.close()
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('onClose does NOT fire when a sibling displaces this dropdown', () => {
    // Documented behaviour: displacing another dropdown overwrites
    // the shared slot directly, without calling the displaced
    // instance's `close()`.
    const onClose = vi.fn()
    const w1 = mount(defineComponent({
      setup() { return useDropdown({ onClose }) },
      render() { return h('div', { ref: 'rootRef' }) },
    }))
    mounted.push(w1)

    const w2 = makeWrapper()

    w1.vm.open()
    w2.vm.open()

    expect(w1.vm.isOpen).toBe(false)
    expect(onClose).not.toHaveBeenCalled()
  })
})

describe('useDropdown — Escape key', () => {
  it('Escape closes an open dropdown', () => {
    const w = makeWrapper()
    w.vm.open()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(w.vm.isOpen).toBe(false)
  })

  it('Escape on a closed dropdown is a no-op', () => {
    const w = makeWrapper()
    expect(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    }).not.toThrow()
  })
})

describe('useDropdown — outside click', () => {
  it('a click outside the root element closes the dropdown', () => {
    const wrapper = mount(defineComponent({
      setup() { return useDropdown() },
      render() { return h('div', { ref: 'rootRef', id: 'dd-root' }) },
    }), { attachTo: document.body })
    mounted.push(wrapper)

    wrapper.vm.open()

    const outside = document.createElement('div')
    document.body.appendChild(outside)
    outside.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(wrapper.vm.isOpen).toBe(false)
    outside.remove()
  })
})

describe('useDropdown — unmount releases the slot', () => {
  it('after unmount, a sibling can open', () => {
    const w1 = makeWrapper()
    w1.vm.open()
    w1.unmount()

    const w2 = makeWrapper()
    w2.vm.open()
    expect(w2.vm.isOpen).toBe(true)
  })
})
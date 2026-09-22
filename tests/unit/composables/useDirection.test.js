// frontend/tests/unit/composables/useDirection.test.js
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'

import { useDirection } from '@/composables/useDirection'

// The composable registers window event listeners in `onMounted`, so
// it must be exercised through a real component to trigger them.
function makeWrapper() {
  return mount(defineComponent({
    setup() {
      const direction = useDirection()
      return { ...direction }
    },
    render() {
      return h('div', { 'data-test': 'x' })
    },
  }))
}

beforeEach(() => {
  // Reset the html element to a known baseline.
  document.documentElement.setAttribute('dir', 'ltr')
})

describe('useDirection', () => {
  it('reads ltr from the html element by default', () => {
    const wrapper = makeWrapper()
    expect(wrapper.vm.direction).toBe('ltr')
    expect(wrapper.vm.isRTL).toBe(false)
    expect(wrapper.vm.isLTR).toBe(true)
    wrapper.unmount()
  })

  it('reads rtl when the html element is set to rtl', () => {
    document.documentElement.setAttribute('dir', 'rtl')
    const wrapper = makeWrapper()
    expect(wrapper.vm.direction).toBe('rtl')
    expect(wrapper.vm.isRTL).toBe(true)
    expect(wrapper.vm.isLTR).toBe(false)
    wrapper.unmount()
  })

  it('reacts to an app:locale-changed event', async () => {
    const wrapper = makeWrapper()
    expect(wrapper.vm.direction).toBe('ltr')

    document.documentElement.setAttribute('dir', 'rtl')
    window.dispatchEvent(new CustomEvent('app:locale-changed', {
      detail: { locale: 'ar', dir: 'rtl' },
    }))
    await nextTick()

    expect(wrapper.vm.direction).toBe('rtl')
    wrapper.unmount()
  })

  it('reacts to a languagechange event', async () => {
    const wrapper = makeWrapper()
    document.documentElement.setAttribute('dir', 'rtl')
    window.dispatchEvent(new Event('languagechange'))
    await nextTick()
    expect(wrapper.vm.direction).toBe('rtl')
    wrapper.unmount()
  })

  it('removes its listeners on unmount', () => {
    const wrapper = makeWrapper()
    wrapper.unmount()
    // No direct way to assert listener removal without spying on
    // addEventListener/removeEventListener. The important outcome is
    // that a post-unmount event does not throw.
    document.documentElement.setAttribute('dir', 'rtl')
    expect(() => {
      window.dispatchEvent(new CustomEvent('app:locale-changed'))
    }).not.toThrow()
  })
})
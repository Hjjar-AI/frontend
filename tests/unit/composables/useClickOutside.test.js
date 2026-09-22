// frontend/tests/unit/composables/useClickOutside.test.js
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'

import { useClickOutside } from '@/composables/useClickOutside'

describe('useClickOutside', () => {
  it('calls the callback when a click lands outside the element', async () => {
    const callback = vi.fn()
    const elementRef = ref(null)

    const wrapper = mount(defineComponent({
      setup() {
        useClickOutside(elementRef, callback)
        return { elementRef }
      },
      render() {
        return h('div', { ref: 'elementRef', id: 'inside' }, [
          h('span', { id: 'child' }, 'child'),
        ])
      },
    }), { attachTo: document.body })

    const outside = document.createElement('div')
    document.body.appendChild(outside)
    outside.dispatchEvent(new MouseEvent('click', { bubbles: true }))

    expect(callback).toHaveBeenCalledTimes(1)
    outside.remove()
    wrapper.unmount()
  })

  it('does not call the callback for a click inside the element', () => {
    const callback = vi.fn()
    const elementRef = ref(null)

    const wrapper = mount(defineComponent({
      setup() {
        useClickOutside(elementRef, callback)
        return { elementRef }
      },
      render() {
        return h('div', { ref: 'elementRef', id: 'inside' })
      },
    }), { attachTo: document.body })

    document.getElementById('inside').dispatchEvent(
      new MouseEvent('click', { bubbles: true }),
    )
    expect(callback).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('does nothing when the element ref is null', () => {
    const callback = vi.fn()
    const elementRef = ref(null)

    const wrapper = mount(defineComponent({
      setup() {
        useClickOutside(elementRef, callback)
        return {}
      },
      render() { return h('div') },
    }), { attachTo: document.body })

    const outside = document.createElement('div')
    document.body.appendChild(outside)
    outside.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    // No error, callback not fired because there is no element to
    // compare against.
    expect(callback).not.toHaveBeenCalled()
    outside.remove()
    wrapper.unmount()
  })

  it('removes the listener on unmount', () => {
    const callback = vi.fn()
    const elementRef = ref(null)

    const wrapper = mount(defineComponent({
      setup() {
        useClickOutside(elementRef, callback)
        return { elementRef }
      },
      render() { return h('div', { ref: 'elementRef' }) },
    }), { attachTo: document.body })

    wrapper.unmount()

    const outside = document.createElement('div')
    document.body.appendChild(outside)
    outside.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    expect(callback).not.toHaveBeenCalled()
    outside.remove()
  })
})
// frontend/tests/unit/composables/useOnline.test.js
import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'

import { useOnline } from '@/composables/useOnline'

function makeWrapper() {
  return mount(defineComponent({
    setup() {
      return useOnline()
    },
    render() { return h('div') },
  }))
}

beforeEach(() => {
  // Reset navigator.onLine to a known state.
  Object.defineProperty(window.navigator, 'onLine', {
    configurable: true,
    value: true,
  })
})

describe('useOnline', () => {
  it('starts online when navigator.onLine is true', () => {
    const wrapper = makeWrapper()
    expect(wrapper.vm.isOnline).toBe(true)
    expect(wrapper.vm.offline).toBe(false)
    wrapper.unmount()
  })

  it('starts offline when navigator.onLine is false', () => {
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      value: false,
    })
    const wrapper = makeWrapper()
    expect(wrapper.vm.isOnline).toBe(false)
    expect(wrapper.vm.offline).toBe(true)
    wrapper.unmount()
  })

  it('flips to offline on the window offline event', async () => {
    const wrapper = makeWrapper()
    window.dispatchEvent(new Event('offline'))
    await nextTick()
    expect(wrapper.vm.isOnline).toBe(false)
    expect(wrapper.vm.offline).toBe(true)
    wrapper.unmount()
  })

  it('flips back to online on the window online event', async () => {
    Object.defineProperty(window.navigator, 'onLine', {
      configurable: true,
      value: false,
    })
    const wrapper = makeWrapper()
    window.dispatchEvent(new Event('online'))
    await nextTick()
    expect(wrapper.vm.isOnline).toBe(true)
    wrapper.unmount()
  })
})
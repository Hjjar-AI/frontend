// frontend/tests/unit/composables/useMediaQuery.test.js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'

import { useMediaQuery } from '@/composables/useMediaQuery'

let listeners

beforeEach(() => {
  listeners = new Map()
  // Provide a controllable matchMedia. The global setup stub returns
  // matches:false unconditionally; this override lets the test fire
  // the `change` event.
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    addEventListener: (event, handler) => {
      listeners.set(handler, event)
    },
    removeEventListener: (event, handler) => {
      listeners.delete(handler)
    },
    dispatchEvent: () => {},
  }))
})

afterEach(() => {
  listeners.clear()
})

function makeWrapper(query) {
  return mount(defineComponent({
    setup() { return { matches: useMediaQuery(query) } },
    render() { return h('div') },
  }))
}

describe('useMediaQuery', () => {
  it('returns a ref that starts false', () => {
    const wrapper = makeWrapper('(max-width: 768px)')
    expect(wrapper.vm.matches).toBe(false)
    wrapper.unmount()
  })

  it('queries matchMedia with the given query string', () => {
    const wrapper = makeWrapper('(max-width: 900px)')
    expect(window.matchMedia).toHaveBeenCalledWith('(max-width: 900px)')
    wrapper.unmount()
  })

  it('adopts the initial matches value from the MediaQueryList', () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: true,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
    const wrapper = makeWrapper('(min-width: 1024px)')
    expect(wrapper.vm.matches).toBe(true)
    wrapper.unmount()
  })

  it('updates when the media query changes', async () => {
    const wrapper = makeWrapper('(max-width: 768px)')
    expect(wrapper.vm.matches).toBe(false)
    // Fire the change event that `matchMedia` would fire.
    for (const [handler] of listeners) {
      handler({ matches: true })
    }
    await nextTick()
    expect(wrapper.vm.matches).toBe(true)
    wrapper.unmount()
  })

  it('removes the listener on unmount', () => {
    const wrapper = makeWrapper('(max-width: 768px)')
    expect(listeners.size).toBe(1)
    wrapper.unmount()
    expect(listeners.size).toBe(0)
  })
})
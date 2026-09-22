// frontend/tests/unit/composables/useTestNavigation.test.js
//
// Tests for the keyboard and swipe handlers in the exam runner.
//
// DISPATCH TARGET
// ---------------
// The composable registers its keydown listener on `window`
// (`window.addEventListener('keydown', handleKeydown)`). Dispatching
// a KeyboardEvent on `document` in happy-dom does not propagate up
// to `window`, so every keyboard test below dispatches on `window`
// directly. The touch handlers are registered per-element by the
// composable's `setup()` method, so the swipe tests continue to
// dispatch on the wrapper element.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import { createPinia, setActivePinia } from 'pinia'

import { useTestNavigation } from '@/composables/useTestNavigation'

beforeEach(() => {
  setActivePinia(createPinia())
  document.documentElement.setAttribute('dir', 'ltr')
})

afterEach(() => {
  document.documentElement.setAttribute('dir', 'ltr')
})

function makeWrapper(handlers = {}) {
  let nav = null
  const container = ref(null)
  const wrapper = mount(defineComponent({
    setup() {
      nav = useTestNavigation(handlers)
      return { container }
    },
    render() {
      return h('div', { ref: 'container' })
    },
  }), { attachTo: document.body })
  nav.setup(wrapper.element)
  return { wrapper, nav }
}

function keydown(key) {
  window.dispatchEvent(new KeyboardEvent('keydown', { key }))
}

describe('useTestNavigation — keyboard number keys', () => {
  it('calls onAnswer with the parsed number for keys 1-8', () => {
    const onAnswer = vi.fn()
    const { wrapper } = makeWrapper({ onAnswer })
    for (const n of [1, 2, 3, 4, 5, 6, 7, 8]) {
      keydown(String(n))
    }
    expect(onAnswer).toHaveBeenCalledTimes(8)
    expect(onAnswer.mock.calls.map((c) => c[0])).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    wrapper.unmount()
  })

  it('ignores keys above the max choice count', () => {
    const onAnswer = vi.fn()
    const { wrapper } = makeWrapper({ onAnswer })
    keydown('9')
    keydown('0')
    expect(onAnswer).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('ignores keys when focus is inside a text input', () => {
    const onAnswer = vi.fn()
    const { wrapper } = makeWrapper({ onAnswer })
    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()
    input.dispatchEvent(new KeyboardEvent('keydown', { key: '1', bubbles: true }))
    expect(onAnswer).not.toHaveBeenCalled()
    input.remove()
    wrapper.unmount()
  })
})

describe('useTestNavigation — LTR arrow semantics', () => {
  beforeEach(() => {
    document.documentElement.setAttribute('dir', 'ltr')
  })

  it('ArrowRight calls onNext in LTR', () => {
    const onNext = vi.fn()
    const onPrevious = vi.fn()
    const { wrapper } = makeWrapper({ onNext, onPrevious })
    keydown('ArrowRight')
    expect(onNext).toHaveBeenCalledTimes(1)
    expect(onPrevious).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('ArrowLeft calls onPrevious in LTR', () => {
    const onNext = vi.fn()
    const onPrevious = vi.fn()
    const { wrapper } = makeWrapper({ onNext, onPrevious })
    keydown('ArrowLeft')
    expect(onPrevious).toHaveBeenCalledTimes(1)
    expect(onNext).not.toHaveBeenCalled()
    wrapper.unmount()
  })
})

describe('useTestNavigation — RTL arrow semantics (inverted)', () => {
  beforeEach(() => {
    document.documentElement.setAttribute('dir', 'rtl')
  })

  it('ArrowRight calls onPrevious in RTL', () => {
    const onNext = vi.fn()
    const onPrevious = vi.fn()
    const { wrapper } = makeWrapper({ onNext, onPrevious })
    keydown('ArrowRight')
    expect(onPrevious).toHaveBeenCalledTimes(1)
    expect(onNext).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('ArrowLeft calls onNext in RTL', () => {
    const onNext = vi.fn()
    const onPrevious = vi.fn()
    const { wrapper } = makeWrapper({ onNext, onPrevious })
    keydown('ArrowLeft')
    expect(onNext).toHaveBeenCalledTimes(1)
    expect(onPrevious).not.toHaveBeenCalled()
    wrapper.unmount()
  })
})

describe('useTestNavigation — Escape', () => {
  it('calls onFinish when Escape is pressed', () => {
    const onFinish = vi.fn()
    const { wrapper } = makeWrapper({ onFinish })
    keydown('Escape')
    expect(onFinish).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('is a no-op when no onFinish handler is provided', () => {
    const { wrapper } = makeWrapper({})
    expect(() => keydown('Escape')).not.toThrow()
    wrapper.unmount()
  })
})

describe('useTestNavigation — touch swipe (direction-independent)', () => {
  function dispatchTouch(el, type, screenX) {
    const evt = new Event(type, { bubbles: true })
    evt.changedTouches = [{ screenX }]
    el.dispatchEvent(evt)
  }

  it('a rightward swipe calls onPrevious', () => {
    const onNext = vi.fn()
    const onPrevious = vi.fn()
    const { wrapper } = makeWrapper({ onNext, onPrevious })
    dispatchTouch(wrapper.element, 'touchstart', 100)
    dispatchTouch(wrapper.element, 'touchend', 200)
    expect(onPrevious).toHaveBeenCalledTimes(1)
    expect(onNext).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('a leftward swipe calls onNext', () => {
    const onNext = vi.fn()
    const onPrevious = vi.fn()
    const { wrapper } = makeWrapper({ onNext, onPrevious })
    dispatchTouch(wrapper.element, 'touchstart', 200)
    dispatchTouch(wrapper.element, 'touchend', 100)
    expect(onNext).toHaveBeenCalledTimes(1)
    expect(onPrevious).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('a swipe under 50px is ignored', () => {
    const onNext = vi.fn()
    const onPrevious = vi.fn()
    const { wrapper } = makeWrapper({ onNext, onPrevious })
    dispatchTouch(wrapper.element, 'touchstart', 100)
    dispatchTouch(wrapper.element, 'touchend', 140)
    expect(onNext).not.toHaveBeenCalled()
    expect(onPrevious).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('a rightward swipe calls onPrevious in RTL too (physical gesture)', () => {
    document.documentElement.setAttribute('dir', 'rtl')
    const onNext = vi.fn()
    const onPrevious = vi.fn()
    const { wrapper } = makeWrapper({ onNext, onPrevious })
    dispatchTouch(wrapper.element, 'touchstart', 100)
    dispatchTouch(wrapper.element, 'touchend', 200)
    expect(onPrevious).toHaveBeenCalledTimes(1)
    expect(onNext).not.toHaveBeenCalled()
    wrapper.unmount()
  })
})

describe('useTestNavigation — enabled gate', () => {
  it('does not fire handlers when enabled is false', () => {
    const onAnswer = vi.fn()
    const onNext = vi.fn()
    const wrapper = mount(defineComponent({
      setup() { useTestNavigation({ onAnswer, onNext, enabled: () => false }); return {} },
      render() { return h('div') },
    }))
    keydown('1')
    keydown('ArrowRight')
    expect(onAnswer).not.toHaveBeenCalled()
    expect(onNext).not.toHaveBeenCalled()
    wrapper.unmount()
  })
})

describe('useTestNavigation — cleanup', () => {
  it('removes listeners on unmount so a later keypress does not fire', () => {
    const onAnswer = vi.fn()
    const wrapper = mount(defineComponent({
      setup() { useTestNavigation({ onAnswer }); return {} },
      render() { return h('div') },
    }))
    wrapper.unmount()
    keydown('1')
    expect(onAnswer).not.toHaveBeenCalled()
  })
})
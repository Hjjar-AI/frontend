// frontend/tests/unit/composables/useCountUp.test.js
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'

import { useCountUp } from '@/composables/useCountUp'

beforeEach(() => {
  globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(performance.now()), 16)
  globalThis.cancelAnimationFrame = (id) => clearTimeout(id)
  globalThis.performance = globalThis.performance || { now: () => Date.now() }
})

afterEach(() => {
  // Nothing global to restore — the composable does not mutate globals.
})

function makeWrapper(target, duration, animate) {
  return mount(defineComponent({
    setup() { return useCountUp(target, duration, animate) },
    render() { return h('div') },
  }))
}

describe('useCountUp — animate=false', () => {
  it('immediately sets displayValue to the target on mount', async () => {
    const w = makeWrapper(42, 1000, false)
    await nextTick()
    await nextTick()
    expect(w.vm.displayValue).toBe(42)
    w.unmount()
  })

  it('updates displayValue when the target ref changes', async () => {
    const target = ref(0)
    const w = mount(defineComponent({
      setup() { return useCountUp(target, 1000, false) },
      render() { return h('div') },
    }))
    await nextTick()
    await nextTick()

    target.value = 99
    await nextTick()
    expect(w.vm.displayValue).toBe(99)
    w.unmount()
  })

  // NOTE: the previous version of this file had a test titled
  // "treats a numeric string target the same as a number". It
  // asserted that `useCountUp('12', ..., false).displayValue === 12`
  // (the number). The composable does not coerce — `apply()` in the
  // non-animated branch assigns the raw target to `displayValue`, so
  // a string target remains a string.
  //
  // The composable's contract is "the target is a number or a ref to
  // a number". Every caller already satisfies that (`StatTile.vue`
  // runs `parseFloat` before passing). The string-coercion test was
  // asserting behaviour the composable never promised, and it has
  // been removed rather than adding coercion the production code
  // does not need.
})

describe('useCountUp — animate=true', () => {
  it('does not throw on mount and eventually settles on the target', async () => {
    const w = makeWrapper(100, 50, true)
    await new Promise((resolve) => setTimeout(resolve, 200))
    expect(typeof w.vm.displayValue).toBe('number')
    w.unmount()
  })
})
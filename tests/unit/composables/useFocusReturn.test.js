// frontend/tests/unit/composables/useFocusReturn.test.js
//
// Tests for the focus-return helper.
//
// OBSERVABLE CONTRACT
// -------------------
// `useFocusReturn` returns `{ storeFocus, restoreFocus }`. The
// internal `previousActiveElement` ref is NOT exposed — that is
// deliberate, so a caller cannot accidentally corrupt the stored
// value by writing to it.
//
// The tests below therefore assert on the observable effect of
// `restoreFocus`, not on the internal ref. The two behaviors that
// matter are:
//
//   1. `restoreFocus` moves `document.activeElement` back to the
//      element that was focused when `storeFocus` ran.
//   2. `restoreFocus` clears the stored value, so a second call is
//      a no-op.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'

import { useFocusReturn } from '@/composables/useFocusReturn'

beforeEach(() => { vi.useFakeTimers() })
afterEach(() => { vi.useRealTimers() })

function makeWrapper() {
  return mount(defineComponent({
    setup() { return useFocusReturn() },
    render() { return h('div') },
  }), { attachTo: document.body })
}

function makeButton(text = 'x') {
  const btn = document.createElement('button')
  btn.textContent = text
  document.body.appendChild(btn)
  return btn
}

describe('useFocusReturn', () => {
  it('restoreFocus returns focus to the element that was focused at storeFocus time', () => {
    const button = makeButton()
    button.focus()

    const w = makeWrapper()
    w.vm.storeFocus()

    // Move focus elsewhere.
    const other = makeButton()
    other.focus()
    expect(document.activeElement).toBe(other)

    w.vm.restoreFocus()
    vi.advanceTimersByTime(20)
    expect(document.activeElement).toBe(button)

    button.remove()
    other.remove()
    w.unmount()
  })

  it('restoreFocus is a no-op when nothing was stored', () => {
    const w = makeWrapper()
    const before = document.activeElement
    expect(() => {
      w.vm.restoreFocus()
      vi.advanceTimersByTime(20)
    }).not.toThrow()
    // Focus did not move.
    expect(document.activeElement).toBe(before)
    w.unmount()
  })

  it('a second restoreFocus after a successful restore does not move focus again', () => {
    const button = makeButton()
    button.focus()

    const w = makeWrapper()
    w.vm.storeFocus()
    w.vm.restoreFocus()
    vi.advanceTimersByTime(20)
    expect(document.activeElement).toBe(button)

    // Move focus away again.
    const other = makeButton()
    other.focus()
    expect(document.activeElement).toBe(other)

    // Second restoreFocus is a no-op because the stored ref was
    // cleared by the first call.
    w.vm.restoreFocus()
    vi.advanceTimersByTime(20)
    expect(document.activeElement).toBe(other)

    button.remove()
    other.remove()
    w.unmount()
  })

  it('does not focus an element that was detached before the deferred focus ran', () => {
    const button = makeButton()
    button.focus()

    const w = makeWrapper()
    w.vm.storeFocus()

    // Detach the button before the deferred focus runs.
    button.remove()
    const other = makeButton()
    other.focus()

    w.vm.restoreFocus()
    vi.advanceTimersByTime(20)

    // Focus stayed on `other` because `button` is no longer in the
    // document.
    expect(document.activeElement).toBe(other)

    other.remove()
    w.unmount()
  })

  it('storeFocus captures the element that had focus at call time, not the wrapper', () => {
    const button = makeButton('target')
    button.focus()

    const w = makeWrapper()
    w.vm.storeFocus()

    // Move focus to a second button, then to a third.
    const second = makeButton('second')
    second.focus()
    const third = makeButton('third')
    third.focus()

    // restoreFocus should land on the ORIGINAL target, not on any of
    // the intermediate ones.
    w.vm.restoreFocus()
    vi.advanceTimersByTime(20)
    expect(document.activeElement).toBe(button)

    button.remove()
    second.remove()
    third.remove()
    w.unmount()
  })
})
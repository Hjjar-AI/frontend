// frontend/tests/unit/composables/useDialog.test.js
//
// Tests for the dialog queue.
//
// WHY THE DRAIN IN afterEach
// --------------------------
// `useDialog` holds its state at module scope — a single shared
// `dialogState` object and two shared queues. That is the design:
// the singleton lets `AppDialogs.vue` render whatever the current
// caller has asked for, without any context plumbing.
//
// The test file therefore cannot isolate tests by resetting state
// between them; the state lives outside the test. Instead,
// `afterEach` drains any pending prompt or confirm by resolving
// them, then awaits the microtask flush that advances the queue.
// A test that leaves the queue non-empty would leak into the next
// test, so the drain runs unconditionally.
//
// CONFIRM AND PROMPT ARE INDEPENDENT
// ----------------------------------
// The composable has TWO separate queues (`confirmQueue` and
// `promptQueue`) and TWO separate visibility flags. Nothing in the
// implementation coordinates them: a caller can have a confirm
// visible and a prompt visible simultaneously. `AppDialogs.vue`
// renders both `<BaseModal>` elements unconditionally, so both
// modals appear if both flags are true.
//
// This is a deliberate design: an inline prompt (e.g. "re-enter
// your admin password") and a confirm (e.g. "really delete?") are
// semantically different interactions, and forcing them to
// serialise would mean a rejected prompt could still be blocked by
// an unrelated confirm that happened to fire first. The tests below
// pin that behaviour.

import { describe, it, expect, afterEach, beforeEach } from 'vitest'
import { useDialog } from '@/composables/useDialog'

async function flushMicrotasks() {
  for (let i = 0; i < 5; i++) {
    // eslint-disable-next-line no-await-in-loop
    await Promise.resolve()
  }
}

beforeEach(async () => {
  // The queue may have been left non-empty by a prior test.
  const { dialogState, resolveConfirm, resolvePrompt } = useDialog()
  let guard = 0
  while ((dialogState.confirmVisible || dialogState.promptVisible) && guard < 20) {
    if (dialogState.confirmVisible) resolveConfirm(false)
    if (dialogState.promptVisible) resolvePrompt(null)
    // eslint-disable-next-line no-await-in-loop
    await flushMicrotasks()
    guard++
  }
})

afterEach(async () => {
  const { dialogState, resolveConfirm, resolvePrompt } = useDialog()
  let guard = 0
  while ((dialogState.confirmVisible || dialogState.promptVisible) && guard < 20) {
    if (dialogState.confirmVisible) resolveConfirm(false)
    if (dialogState.promptVisible) resolvePrompt(null)
    // eslint-disable-next-line no-await-in-loop
    await flushMicrotasks()
    guard++
  }
})

describe('useDialog — confirm', () => {
  it('shows the confirm dialog with the given message', async () => {
    const { confirm, dialogState } = useDialog()
    confirm('Delete this?')
    await flushMicrotasks()
    expect(dialogState.confirmVisible).toBe(true)
    expect(dialogState.confirmMessage).toBe('Delete this?')
    expect(dialogState.confirmVariant).toBe('default')
  })

  it('carries a custom variant', async () => {
    const { confirm, dialogState } = useDialog()
    confirm('Danger', 'danger')
    await flushMicrotasks()
    expect(dialogState.confirmVariant).toBe('danger')
  })

  it('resolves the promise with true when the caller confirms', async () => {
    const { confirm, resolveConfirm } = useDialog()
    const promise = confirm('OK?')
    await flushMicrotasks()
    resolveConfirm(true)
    await expect(promise).resolves.toBe(true)
  })

  it('resolves the promise with false when the caller declines', async () => {
    const { confirm, resolveConfirm } = useDialog()
    const promise = confirm('OK?')
    await flushMicrotasks()
    resolveConfirm(false)
    await expect(promise).resolves.toBe(false)
  })

  it('hides the dialog after resolution', async () => {
    const { confirm, dialogState, resolveConfirm } = useDialog()
    confirm('OK?')
    await flushMicrotasks()
    resolveConfirm(true)
    await flushMicrotasks()
    expect(dialogState.confirmVisible).toBe(false)
  })
})

describe('useDialog — confirm queue', () => {
  it('queues a second confirm while the first is visible', async () => {
    const { confirm, dialogState, resolveConfirm } = useDialog()
    const p1 = confirm('First')
    const p2 = confirm('Second')
    await flushMicrotasks()

    expect(dialogState.confirmMessage).toBe('First')
    expect(dialogState.confirmVisible).toBe(true)

    resolveConfirm(true)
    await flushMicrotasks()
    expect(dialogState.confirmMessage).toBe('Second')
    expect(dialogState.confirmVisible).toBe(true)

    resolveConfirm(false)
    await flushMicrotasks()
    expect(dialogState.confirmVisible).toBe(false)

    await expect(p1).resolves.toBe(true)
    await expect(p2).resolves.toBe(false)
  })

  it('queues three confirms and resolves them in submission order', async () => {
    const { confirm, resolveConfirm } = useDialog()
    const p1 = confirm('A')
    const p2 = confirm('B')
    const p3 = confirm('C')
    await flushMicrotasks()

    resolveConfirm(true)
    await flushMicrotasks()
    resolveConfirm(false)
    await flushMicrotasks()
    resolveConfirm(true)
    await flushMicrotasks()

    await expect(p1).resolves.toBe(true)
    await expect(p2).resolves.toBe(false)
    await expect(p3).resolves.toBe(true)
  })
})

describe('useDialog — prompt', () => {
  it('shows the prompt dialog with the given message and default', async () => {
    const { prompt, dialogState } = useDialog()
    prompt('Enter your name', 'Alice')
    await flushMicrotasks()
    expect(dialogState.promptVisible).toBe(true)
    expect(dialogState.promptMessage).toBe('Enter your name')
    expect(dialogState.promptDefault).toBe('Alice')
  })

  it('resolves the promise with the submitted value', async () => {
    const { prompt, resolvePrompt } = useDialog()
    const promise = prompt('Name?')
    await flushMicrotasks()
    resolvePrompt('Bob')
    await expect(promise).resolves.toBe('Bob')
  })

  it('resolves with null on cancel', async () => {
    const { prompt, resolvePrompt } = useDialog()
    const promise = prompt('Name?')
    await flushMicrotasks()
    resolvePrompt(null)
    await expect(promise).resolves.toBeNull()
  })

  it('defaults the value to an empty string when not supplied', async () => {
    const { prompt, dialogState } = useDialog()
    prompt('Name?')
    await flushMicrotasks()
    expect(dialogState.promptDefault).toBe('')
  })
})

describe('useDialog — prompt queue', () => {
  it('queues a second prompt while the first is visible', async () => {
    const { prompt, dialogState, resolvePrompt } = useDialog()
    const p1 = prompt('First')
    const p2 = prompt('Second')
    await flushMicrotasks()

    expect(dialogState.promptMessage).toBe('First')

    resolvePrompt('one')
    await flushMicrotasks()
    expect(dialogState.promptMessage).toBe('Second')

    resolvePrompt('two')
    await flushMicrotasks()
    expect(dialogState.promptVisible).toBe(false)

    await expect(p1).resolves.toBe('one')
    await expect(p2).resolves.toBe('two')
  })
})

describe('useDialog — confirm and prompt are independent', () => {
  it('a visible confirm does not delay a queued prompt', async () => {
    // The composable has two independent queues and two independent
    // visibility flags. A visible confirm does not block a queued
    // prompt from becoming visible; both modals can be on screen at
    // once. This is the documented design — see the file header.
    const { confirm, prompt, dialogState, resolveConfirm, resolvePrompt } = useDialog()
    const c = confirm('Confirm A')
    const p = prompt('Prompt A')
    await flushMicrotasks()

    // Both are visible simultaneously. `AppDialogs.vue` renders
    // both modals, so both appear.
    expect(dialogState.confirmVisible).toBe(true)
    expect(dialogState.promptVisible).toBe(true)

    resolveConfirm(true)
    resolvePrompt('answer')
    await flushMicrotasks()

    await expect(c).resolves.toBe(true)
    await expect(p).resolves.toBe('answer')
  })

  it('resolving a prompt does not touch the confirm queue', async () => {
    const { confirm, prompt, dialogState, resolveConfirm, resolvePrompt } = useDialog()
    const c = confirm('Confirm A')
    const p = prompt('Prompt A')
    await flushMicrotasks()

    resolvePrompt('x')
    await flushMicrotasks()

    // Prompt is gone, confirm is still visible.
    expect(dialogState.promptVisible).toBe(false)
    expect(dialogState.confirmVisible).toBe(true)

    resolveConfirm(true)
    await flushMicrotasks()

    await expect(c).resolves.toBe(true)
    await expect(p).resolves.toBe('x')
  })
})
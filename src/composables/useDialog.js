// frontend/src/composables/useDialog.js
import { reactive } from 'vue'
import { createSingletonReactive } from './composableHelpers'


const state = createSingletonReactive({
  confirmVisible: false,
  confirmMessage: '',
  confirmVariant: 'default',
  confirmResolve: null,
  promptVisible: false,
  promptMessage: '',
  promptDefault: '',
  promptResolve: null,
})

// Pending requests waiting for the current dialog to close. Entries
// are { message, variant|default, resolve }.
const confirmQueue = []
const promptQueue = []

function showNextConfirm() {
  if (state.confirmVisible) return
  const next = confirmQueue.shift()
  if (!next) return
  state.confirmMessage = next.message
  state.confirmVariant = next.variant
  state.confirmVisible = true
  state.confirmResolve = next.resolve
}

function showNextPrompt() {
  if (state.promptVisible) return
  const next = promptQueue.shift()
  if (!next) return
  state.promptMessage = next.message
  state.promptDefault = next.defaultValue
  state.promptVisible = true
  state.promptResolve = next.resolve
}

export function useDialog() {
    function confirm(message, variant = 'default') {
    return new Promise((resolve) => {
      confirmQueue.push({ message, variant, resolve })
      showNextConfirm()
    })
  }

    function prompt(message, defaultValue = '') {
    return new Promise((resolve) => {
      promptQueue.push({ message, defaultValue, resolve })
      showNextPrompt()
    })
  }

  function resolveConfirm(value) {
    const resolver = state.confirmResolve
    state.confirmResolve = null
    state.confirmVisible = false
    if (resolver) resolver(value)
    // Defer the next one so Vue can flush the current dialog's close
    // transition before the next one opens.
    Promise.resolve().then(showNextConfirm)
  }

  function resolvePrompt(value) {
    const resolver = state.promptResolve
    state.promptResolve = null
    state.promptVisible = false
    if (resolver) resolver(value)
    Promise.resolve().then(showNextPrompt)
  }

  return {
    confirm,
    prompt,
    resolveConfirm,
    resolvePrompt,
    // expose reactive state for AppDialogs
    dialogState: state,
  }
}
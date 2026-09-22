// frontend/src/main.js
import { createApp, watch } from 'vue'
import App from './App.vue'
import router from './router'
import pinia from '@/stores/index'
import './assets/index.css'
import { i18n } from '@/i18n'
import { applyLocaleToDOM } from '@/i18n/helpers/direction'
import { useNotify } from '@/composables/useNotify'
import { useConfigStore } from '@/stores/configStore'
import { useTestSessionStore } from '@/stores/testSessionStore'
import { usePreferencesStore } from '@/stores/preferencesStore'
import { useTheme } from '@/composables/useTheme'

const app = createApp(App)
app.use(pinia)
app.use(router)
app.use(i18n)

// Global Vue error handler
app.config.errorHandler = (err, instance, info) => {
  console.error(err, info)
  const { notify } = useNotify()
  notify(i18n.global.t('common.unexpectedError'), 'error')
}

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason
  const code = reason?.code

  if (code === 'CANCEL') {
    event.preventDefault()
    return
  }

  console.error('Unhandled promise rejection:', reason)
  const { notify } = useNotify()
  notify(i18n.global.t('common.unexpectedError'), 'error')
  event.preventDefault()
})

const preferencesStore = usePreferencesStore()
preferencesStore.load()

const { loadSavedTheme } = useTheme()
loadSavedTheme()

// i18n: apply the persisted locale to <html lang dir data-locale>.
// `i18n.global.locale` is a ref in Composition mode.
applyLocaleToDOM(i18n.global.locale.value)

function applyDocumentTitle() {
  if (typeof document !== 'undefined') {
    document.title = i18n.global.t('app.name')
  }
}
applyDocumentTitle()
watch(() => i18n.global.locale.value, applyDocumentTitle)

const configStore = useConfigStore()
const testSessionStore = useTestSessionStore()

configStore.fetchConfig().finally(() => {
  testSessionStore.hydrateFromSession()
  app.mount('#app')
})
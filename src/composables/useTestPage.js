// frontend/src/composables/useTestPage.js
import { unref } from 'vue'
import { useAsyncState } from './composableHelpers'
import { useRouter } from 'vue-router'
import { useTestSessionStore } from '@/stores/testSessionStore'
import { useDialog } from '@/composables/useDialog'
import { useNotify } from '@/composables/useNotify'
import { i18n } from '@/i18n'

export function useTestPage(modeOrRef) {
  const router = useRouter()
  const store = useTestSessionStore()
  const { confirm } = useDialog()
  const { notify } = useNotify()
  const { isLoading, setLoading, setSuccess, setError } = useAsyncState()

  const t = i18n.global.t

  function readMode() {
    return typeof modeOrRef === 'function' ? modeOrRef() : unref(modeOrRef)
  }

  async function start(config) {
    const mode = readMode()
    setLoading()
    try {
      const result = await store.start(mode, config)
      if (result) {
        setSuccess()
        router.push(`/${mode}/question`)
      } else {

        if (store.status === 'error') {
          setError(new Error(store.error || t('notifications.sessionStartFailed')))
        } else {
          setSuccess()
        }
      }
    } catch (e) {
      setError(e)
      throw e
    }
  }

  async function resume() {
    const mode = readMode()
    setLoading()
    try {
      const result = await store.resume()
      if (!result) {

        if (store.status === 'error') {
          setError(new Error(store.error || t('notifications.resumeFailed')))
        } else {
          setSuccess()
        }
        return
      }
      setSuccess()
      router.push(`/${mode}/question`)
    } catch (e) {
      setError(e)

      notify(e?.message || t('tests.resumeFailed'), 'error')
    }
  }

  async function discardProgress() {
    const ok = await confirm(t('tests.discardConfirm'))
    if (!ok) return
    await store.discardProgress()
  }

  return { store, isLoading, start, resume, discardProgress }
}
// frontend/src/composables/confirmAction.js
import { useDialog } from '@/composables/useDialog'
import { i18n } from '@/i18n'

export async function confirmAction({ message, messageKey, messageParams, action }) {
  const { confirm } = useDialog()

  const resolvedMessage = messageKey
    ? i18n.global.t(messageKey, messageParams || {})
    : message

  const ok = await confirm(resolvedMessage)
  if (!ok) return false

  try {
    const result = await action()
    return result !== false && result !== null
  } catch (err) {
    console.error('confirmAction failed:', err)
    return false
  }
}
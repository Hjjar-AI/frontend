import { computed, onBeforeUnmount, onMounted, ref, toValue } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import { useDialog } from '@/composables/useDialog'

function stableValue(value) {
  if (typeof File !== 'undefined' && value instanceof File) {
    return {
      __file: true,
      name: value.name,
      size: value.size,
      type: value.type,
      lastModified: value.lastModified,
    }
  }
  if (Array.isArray(value)) return value.map(stableValue)
  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce((result, key) => {
        result[key] = stableValue(value[key])
        return result
      }, {})
  }
  return value
}

function fingerprint(value) {
  return JSON.stringify(stableValue(value))
}

/** Protects a form from accidental route changes and browser unloads. */
export function useUnsavedChanges(source, options = {}) {
  const { confirm } = useDialog()
  const baseline = ref('')
  const ready = ref(false)
  const bypassOnce = ref(false)
  const current = computed(() => fingerprint(toValue(source)))
  const isDirty = computed(() => ready.value && current.value !== baseline.value)

  function markClean() {
    baseline.value = current.value
    ready.value = true
  }

  function allowNextNavigation() {
    bypassOnce.value = true
  }

  function message() {
    return typeof options.message === 'function' ? options.message() : options.message
  }

  function handleBeforeUnload(event) {
    if (!isDirty.value) return
    event.preventDefault()
    event.returnValue = ''
  }

  onBeforeRouteLeave(async () => {
    if (bypassOnce.value) {
      bypassOnce.value = false
      return true
    }
    if (!isDirty.value) return true
    return confirm(message(), 'warning')
  })

  onMounted(() => window.addEventListener('beforeunload', handleBeforeUnload))
  onBeforeUnmount(() => window.removeEventListener('beforeunload', handleBeforeUnload))

  return { isDirty, markClean, allowNextNavigation }
}

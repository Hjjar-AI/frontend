// frontend/src/composables/useRecentItems.js
import { ref, onMounted, computed } from 'vue'
import { storageService } from '@/services/storageService'
import { useAuthStore } from '@/stores/authStore'

export function useRecentItems(key, maxItems = 5) {
  const authStore = useAuthStore()

  const userId = computed(() => authStore.user?.id || 'guest')
  const storageKey = computed(() => `recent_${userId.value}_${key}`)

  const recentIds = ref([])

  function load() {
    try {
      const stored = storageService.getItem(storageKey.value)
      if (stored) {
        recentIds.value = JSON.parse(stored).slice(0, maxItems)
      }
    } catch {
      recentIds.value = []
    }
  }

  function add(id) {
    const filtered = recentIds.value.filter(i => i !== id)
    filtered.unshift(id)
    recentIds.value = filtered.slice(0, maxItems)
    storageService.setItem(storageKey.value, JSON.stringify(recentIds.value))
  }

  onMounted(load)

  return {
    recentIds,
    add,
    load,
  }
}
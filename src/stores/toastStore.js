// frontend/src/stores/toastStore.js
import { defineStore } from 'pinia'
import { standardState, standardGetters, makeReset } from '@/stores/storeHelpers'

export const useToastStore = defineStore('toast', {
  state: () => standardState({ toasts: [], nextId: 1 }),
  getters: {
    ...standardGetters,
  },
  actions: {
        addToast(message, type = 'info', duration = 4000) {
      const id = this.nextId++
      const toast = { id, message, type }
      this.toasts.push(toast)
      if (duration > 0) {
        setTimeout(() => {
          this.removeToast(id)
        }, duration)
      }
      return id
    },
        removeToast(id) {
      const index = this.toasts.findIndex(t => t.id === id)
      if (index !== -1) {
        this.toasts.splice(index, 1)
      }
    },
        reset: makeReset({ toasts: [], nextId: 1, status: 'idle', error: null }),
  },
})
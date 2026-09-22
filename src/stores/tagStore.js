import { defineStore } from 'pinia'
import { tagService } from '@/services/tagService'
import { useCrudActions } from '@/composables/useCrudActions'
import {
  standardState,
  standardGetters,
  subResourceState,
  subResourceGetters,
  makeReset,
} from '@/stores/storeHelpers'

export const useTagStore = defineStore('tags', {
  state: () =>
    standardState({
      items: [],
      tree: [],
      ...subResourceState('tree'),
    }),

  getters: {
    ...standardGetters,
    ...subResourceGetters('tree'),
    names: (state) =>
      state.items.map((tag) => (typeof tag === 'string' ? tag : tag.name)).filter(Boolean),
  },

  actions: {
    async fetchList() {
      return await useCrudActions(this).wrap(() => tagService.list(), {
        errorMsgFallbackKey: 'notifications.tagsLoadFailed',
        suppressErrorToast: true,
        onSuccess: (res) => {
          this.items = res?.items || []
        },
      })
    },

    async fetchTree() {
      return await useCrudActions(this, {
        statusKey: 'treeStatus',
        errorKey: 'treeError',
      }).wrap(() => tagService.getTree(), {
        errorMsgFallbackKey: 'notifications.tagsLoadFailed',
        suppressErrorToast: true,
        onSuccess: (res) => {
          this.tree = res?.tree || []
        },
      })
    },

    async rename(oldName, newName) {
      const result = await useCrudActions(this).wrap(() => tagService.renameTag(oldName, newName), {
        errorMsgFallbackKey: 'admin.tags.renameFailed',
      })
      if (this.status !== 'success') return null
      await this.refresh()
      return result ?? true
    },

    async remove(name) {
      const result = await useCrudActions(this).wrap(() => tagService.deleteTag(name), {
        errorMsgFallbackKey: 'admin.tags.deleteFailed',
      })
      if (this.status !== 'success') return null
      await this.refresh()
      return result ?? true
    },

    async merge(sourceTags, targetTag) {
      const result = await useCrudActions(this).wrap(
        () => tagService.mergeTags(sourceTags, targetTag),
        { errorMsgFallbackKey: 'admin.tags.mergeFailed' },
      )
      if (this.status !== 'success') return null
      await this.refresh()
      return result ?? true
    },

    async refresh() {
      await this.fetchList()
      const treeResult = await this.fetchTree()
      if (!treeResult) {
        this.tree = this.items.map((tag) => ({
          name: typeof tag === 'string' ? tag : tag.name,
          children: [],
        }))
      }
    },

    reset: makeReset({
      items: [],
      tree: [],
      status: 'idle',
      error: null,
      treeStatus: 'idle',
      treeError: null,
    }),
  },
})

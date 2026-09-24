<!-- frontend/src/features/admin/views/Tags.vue -->
<template>
  <Layout>
    <PageShell :title="t('admin.tags.title')" icon="bi bi-tags" page-class="admin-tags">
        <template #actions>
          <BaseButton
            variant="primary"
            @click="showMergeModal = true"
            :disabled="selectedTags.length < 1"
            :title="selectedTags.length < 1 ? t('admin.tags.mergeRequiresOne') : ''"
          >
            <i class="bi bi-shuffle"></i> {{ t('admin.tags.mergeButton') }}
          </BaseButton>
        </template>
      <FeedbackRegion :error="tagError" @dismiss="dismissTagError" />
      <BaseListContainer
        :loading="loading"
        :error="tagError"
        :items="tags"
        :empty-title="t('admin.tags.empty')"
        :empty-message="t('admin.tags.emptyDesc')"
        empty-icon="bi-tags"
        @retry="loadTags"
      >
        <template #default>
          <!-- `tags-tree-scroll` (defined in admin.css) supplies the
               horizontal-overflow wrapper. The recursive tag tree
               adds `padding-inline-start: var(--space-lg)` per
               nesting level, and each row's label renders through
               `BaseCheckbox`'s inline-flex row whose label has no
               `min-width: 0` escape. Without this wrapper, a deeply
               nested tree or a row carrying an unbreakable token
               would push past the card edge with nothing to catch
               it. The class follows the same overflow strategy used
               by `.heatmap-scroll` and the master-exam result
               tables. -->
          <div class="tags-tree tags-tree-scroll">
            <ul class="tag-tree-root">
              <TagTreeNode
                v-for="node in tagTree"
                :key="node.name"
                :node="node"
                :selected-names="selectedTags"
                @rename="openRename"
                @delete="confirmDelete"
                @toggle-select="toggleTag"
              />
            </ul>
          </div>
          <div v-if="selectedTags.length > 0" class="selected-tags-summary">
            <span class="text-muted">
              <i class="bi bi-check-square"></i>
              {{ t('admin.tags.selectedCount', { count: selectedTags.length }) }}
            </span>
            <BaseButton variant="ghost" size="small" class="clear-all-filters" @click="selectedTags = []">
              {{ t('admin.tags.clearSelection') }}
            </BaseButton>
          </div>
        </template>
      </BaseListContainer>

      <BaseModal
        :is-open="renameModalOpen"
        :title="t('admin.tags.renameTitle')"
        size="sm"
        @update:is-open="renameModalOpen = false"
      >
        <form @submit.prevent="submitRename">
          <FormGrid>
            <BaseField :label="t('admin.tags.renameCurrent')">
              <BaseInput :model-value="renameTagName" disabled />
            </BaseField>
            <BaseField :label="t('admin.tags.renameNew')" required>
              <BaseInput v-model="newTagName" required />
            </BaseField>
          </FormGrid>
          <div class="form-actions">
            <BaseButton type="button" variant="secondary" @click="renameModalOpen = false">{{
              t('common.cancel')
            }}</BaseButton>
            <BaseButton type="submit" variant="primary">{{ t('common.update') }}</BaseButton>
          </div>
        </form>
      </BaseModal>

      <BaseModal
        :is-open="showMergeModal"
        :title="t('admin.tags.mergeTitle')"
        size="sm"
        @update:is-open="showMergeModal = false"
      >
        <p>{{ t('admin.tags.mergeCount', { count: selectedTags.length }) }}</p>
        <div class="merge-source-list">
          <BaseBadge v-for="tag in selectedTags" :key="tag" variant="secondary">{{ tag }}</BaseBadge>
        </div>
        <FormGrid>
          <BaseField :label="t('admin.tags.mergeTarget')" required>
            <BaseInput v-model="mergeTarget" required />
          </BaseField>
        </FormGrid>
        <p
          v-if="mergeTarget && selectedTags.includes(mergeTarget)"
          class="text-danger admin-tags__merge-error"
        >
          {{ t('admin.tags.mergeSameError') }}
        </p>
        <div class="form-actions">
          <BaseButton type="button" variant="secondary" @click="showMergeModal = false">{{
            t('common.cancel')
          }}</BaseButton>
          <BaseButton
            type="button"
            variant="primary"
            @click="mergeTags"
            :disabled="!mergeTarget || selectedTags.includes(mergeTarget)"
          >
            {{ t('admin.tags.mergeDo') }}
          </BaseButton>
        </div>
      </BaseModal>
    </PageShell>
  </Layout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import Layout from '@/components/common/Layout.vue'
import PageShell from '@/components/common/PageShell.vue'
import BaseListContainer from '@/components/base/BaseListContainer.vue'
import BaseModal from '@/components/base/BaseModal.vue'
import BaseField from '@/components/base/BaseField.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseBadge from '@/components/base/BaseBadge.vue'
import FormGrid from '@/components/common/FormGrid.vue'
import FeedbackRegion from '@/components/common/FeedbackRegion.vue'
import TagTreeNode from '../components/TagTreeNode.vue'
import { useTagStore } from '@/stores/tagStore'
import { useNotify } from '@/composables/useNotify'
import { useDialog } from '@/composables/useDialog'

const { t } = useI18n()

const tagStore = useTagStore()
const tags = computed(() => tagStore.items)
const tagTree = computed(() => tagStore.tree)
const loading = computed(() => tagStore.isLoading || tagStore.isTreeLoading)
const tagError = computed(() => tagStore.error || '')
const selectedTags = ref([])
const renameModalOpen = ref(false)
const renameTagName = ref('')
const newTagName = ref('')
const showMergeModal = ref(false)
const mergeTarget = ref('')

const { notify } = useNotify()
const { confirm } = useDialog()

function dismissTagError() {
  tagStore.error = null
  tagStore.treeError = null
}

async function loadTags() {
  await tagStore.refresh()
}

function toggleTag(name) {
  const idx = selectedTags.value.indexOf(name)
  if (idx === -1) selectedTags.value.push(name)
  else selectedTags.value.splice(idx, 1)
}

function openRename(node) {
  renameTagName.value = node.name
  newTagName.value = node.name
  renameModalOpen.value = true
}

async function submitRename() {
  try {
    const result = await tagStore.rename(renameTagName.value, newTagName.value)
    if (!result) return
    notify(t('admin.tags.renameSuccess'), 'success')
    renameModalOpen.value = false
    const idx = selectedTags.value.indexOf(renameTagName.value)
    if (idx !== -1) selectedTags.value.splice(idx, 1)
  } catch (e) {
    notify(e.message || t('admin.tags.renameFailed'), 'error')
  }
}

async function confirmDelete(node) {
  if (!(await confirm(t('admin.tags.deleteConfirm', { name: node.name })))) return
  try {
    const result = await tagStore.remove(node.name)
    if (!result) return
    notify(t('admin.tags.deleteSuccess'), 'success')
    const idx = selectedTags.value.indexOf(node.name)
    if (idx !== -1) selectedTags.value.splice(idx, 1)
  } catch (e) {
    notify(e.message || t('admin.tags.deleteFailed'), 'error')
  }
}

async function mergeTags() {
  if (!mergeTarget.value) {
    notify(t('admin.tags.mergeTargetRequired'), 'error')
    return
  }
  if (selectedTags.value.includes(mergeTarget.value)) {
    notify(t('admin.tags.mergeSameError'), 'error')
    return
  }
  try {
    const result = await tagStore.merge(selectedTags.value, mergeTarget.value)
    if (!result) return
    notify(t('admin.tags.mergeSuccess'), 'success')
    showMergeModal.value = false
    selectedTags.value = []
    mergeTarget.value = ''
  } catch (e) {
    notify(e.message || t('admin.tags.mergeFailed'), 'error')
  }
}

onMounted(loadTags)
</script>

<!-- frontend/src/features/admin/views/Blueprints.vue -->
<!-- FEATURE #8 — exam blueprint management. -->
<template>
  <Layout>
    <PageShell
      :title="t('admin.blueprints.title')"
      icon="bi bi-diagram-3"
      page-class="blueprints-page"
    >
        <template #actions>
          <BaseButton variant="primary" @click="formModalRef?.open()">
            <i class="bi bi-plus-circle"></i> {{ t('admin.blueprints.addButton') }}
          </BaseButton>
        </template>
      <ErrorBanner
        :error="blueprintStore.error"
        :retry="blueprintStore.error ? true : false"
        @dismiss="blueprintStore.error = null"
        @retry="loadBlueprints"
      />

      <BaseListContainer
        :loading="blueprintStore.isLoading"
        :items="blueprintStore.items"
        :empty-title="t('admin.blueprints.empty')"
        :empty-message="t('admin.blueprints.emptyDesc')"
        empty-icon="bi-diagram-3"
      >
        <template #emptyActions>
          <BaseButton variant="primary" @click="formModalRef?.open()">
            <i class="bi bi-plus-circle"></i> {{ t('admin.blueprints.createFirst') }}
          </BaseButton>
        </template>
        <template #default="{ items }">
          <div class="entity-list">
            <EntityRow
              v-for="bp in items"
              :key="bp.id"
              :title="bp.name"
              :description="bp.description || ''"
              :inactive="!bp.is_active"
            >
              <template #metadata>
                  <BaseChip
                    v-for="(weight, cid) in bp.weights"
                    :key="cid"
                  >
                    {{ categoryName(cid) }} <strong>{{ weight }}</strong>
                  </BaseChip>
                  <BaseChip
                    v-if="!Object.keys(bp.weights).length"
                    icon="bi bi-shuffle"
                  >
                    {{ t('admin.blueprints.randomDistribution') }}
                  </BaseChip>
              </template>
              <template #actions>
                <BaseButton variant="secondary" size="small" icon="bi bi-pencil" @click="formModalRef?.open(bp)">
                  {{ t('admin.blueprints.edit') }}
                </BaseButton>
                <BaseIconButton
                  variant="danger"
                  size="small"
                  icon="bi bi-trash"
                  :label="t('common.delete')"
                  @click="confirmDelete(bp)"
                />
              </template>
            </EntityRow>
          </div>
        </template>
      </BaseListContainer>


      <BlueprintFormModal ref="formModalRef" @saved="loadBlueprints" />
    </PageShell>
  </Layout>
</template>

<script setup>
import '@/assets/blueprints.css'
import { ref, computed, onMounted } from 'vue'
import Layout from '@/components/common/Layout.vue'
import PageShell from '@/components/common/PageShell.vue'
import BaseListContainer from '@/components/base/BaseListContainer.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseIconButton from '@/components/base/BaseIconButton.vue'
import BaseChip from '@/components/base/BaseChip.vue'
import EntityRow from '@/components/common/EntityRow.vue'
import ErrorBanner from '@/components/common/ErrorBanner.vue'
import BlueprintFormModal from '../components/BlueprintFormModal.vue'
import { useBlueprintStore } from '@/stores/blueprintStore'
import { useCategoryStore } from '@/stores/categoryStore'
import { useDialog } from '@/composables/useDialog'


const { t } = useI18n()

const blueprintStore = useBlueprintStore()
const categoryStore = useCategoryStore()
const { confirm } = useDialog()

const formModalRef = ref(null)

const categories = computed(() => categoryStore.items)

function categoryName(cid) {
  const cat = categories.value.find(c => c.id === Number(cid))
  return cat ? cat.name : `#${cid}`
}

async function loadBlueprints() {
  await blueprintStore.fetchAll()
}

async function confirmDelete(bp) {
  if (!(await confirm(t('admin.blueprints.deleteConfirm', { name: bp.name })))) return
  await blueprintStore.remove(bp.id)
  await loadBlueprints()
}

onMounted(async () => {
  await categoryStore.fetchAll()
  await loadBlueprints()
})
</script>

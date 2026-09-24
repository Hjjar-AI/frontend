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
          <div class="blueprint-list">
            <div
              v-for="bp in items"
              :key="bp.id"
              class="blueprint-row"
              :class="{ 'blueprint-row--inactive': !bp.is_active }"
            >
              <div class="blueprint-row__body">
                <h4 class="blueprint-row__name">{{ bp.name }}</h4>
                <p v-if="bp.description" class="blueprint-row__description">{{ bp.description }}</p>
                <div class="blueprint-row__weights">
                  <span
                    v-for="(weight, cid) in bp.weights"
                    :key="cid"
                    class="blueprint-row__weight-chip"
                  >
                    {{ categoryName(cid) }} <strong>{{ weight }}</strong>
                  </span>
                  <span v-if="!Object.keys(bp.weights).length" class="blueprint-row__weight-chip">
                    <i class="bi bi-shuffle"></i> {{ t('admin.blueprints.randomDistribution') }}
                  </span>
                </div>
              </div>
              <div class="blueprint-row__actions">
                <BaseButton variant="primary" size="small" @click="formModalRef?.open(bp)">
                  <i class="bi bi-pencil"></i> {{ t('admin.blueprints.edit') }}
                </BaseButton>
                <BaseButton variant="danger" size="small" @click="confirmDelete(bp)">
                  <i class="bi bi-trash"></i>
                </BaseButton>
              </div>
            </div>
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

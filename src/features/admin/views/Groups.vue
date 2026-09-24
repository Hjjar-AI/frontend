<!-- frontend/src/features/admin/views/Groups.vue -->
<!-- FEATURE #9 — admin group management (list + create). -->
<template>
  <Layout>
    <PageShell
      :title="t('admin.groups.title')"
      icon="bi bi-people-fill"
      page-class="groups-page"
    >
        <template #actions>
          <BaseButton variant="primary" @click="formModalRef?.open()">
            <i class="bi bi-plus-circle"></i> {{ t('admin.groups.addButton') }}
          </BaseButton>
        </template>
      <ErrorBanner
        :error="groupStore.error"
        :retry="groupStore.error ? true : false"
        @dismiss="groupStore.error = null"
        @retry="loadGroups"
      />

      <BaseListContainer
        :loading="groupStore.isLoading"
        :items="groupStore.adminGroups"
        :empty-title="t('admin.groups.empty')"
        :empty-message="t('admin.groups.emptyDesc')"
        empty-icon="bi-people"
      >
        <template #emptyActions>
          <BaseButton variant="primary" @click="formModalRef?.open()">
            <i class="bi bi-plus-circle"></i> {{ t('admin.groups.createFirst') }}
          </BaseButton>
        </template>
        <template #default="{ items }">
          <div class="entity-list">
            <EntityRow
              v-for="group in items"
              :key="group.id"
              :title="group.name"
              :description="group.description || ''"
              :inactive="!group.is_active"
            >
              <template #metadata>
                  <BaseChip icon="bi bi-people">
                    <strong>{{ group.member_count }}</strong> {{ t('admin.groups.membersLabel') }}
                  </BaseChip>
                  <BaseChip v-if="!group.is_active" icon="bi bi-eye-slash">
                    {{ t('admin.groups.inactive') }}
                  </BaseChip>
              </template>
              <template #actions>
                <BaseButton
                  variant="secondary"
                  size="small"
                  icon="bi bi-pencil"
                  @click="router.push(`/admin/groups/${group.id}`)"
                >
                  {{ t('admin.groups.manage') }}
                </BaseButton>
                <BaseIconButton
                  variant="danger"
                  size="small"
                  icon="bi bi-trash"
                  :label="t('common.delete')"
                  @click="confirmDelete(group)"
                />
              </template>
            </EntityRow>
          </div>
        </template>
      </BaseListContainer>

      <GroupFormModal ref="formModalRef" @saved="loadGroups" />
    </PageShell>
  </Layout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Layout from '@/components/common/Layout.vue'
import PageShell from '@/components/common/PageShell.vue'
import BaseListContainer from '@/components/base/BaseListContainer.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseIconButton from '@/components/base/BaseIconButton.vue'
import BaseChip from '@/components/base/BaseChip.vue'
import EntityRow from '@/components/common/EntityRow.vue'
import ErrorBanner from '@/components/common/ErrorBanner.vue'
import GroupFormModal from '../components/GroupFormModal.vue'
import { useGroupStore } from '@/stores/groupStore'
import { useDialog } from '@/composables/useDialog'


const { t } = useI18n()

const router = useRouter()
const groupStore = useGroupStore()
const { confirm } = useDialog()

const formModalRef = ref(null)

async function loadGroups() {
  await groupStore.fetchAdminGroups(true)
}

async function confirmDelete(group) {
  if (!(await confirm(t('admin.groups.deleteConfirm', { name: group.name })))) return
  await groupStore.deleteGroup(group.id)
  await loadGroups()
}

onMounted(loadGroups)
</script>

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
          <div class="blueprint-list">
            <div
              v-for="group in items"
              :key="group.id"
              class="blueprint-row"
              :class="{ 'blueprint-row--inactive': !group.is_active }"
            >
              <div class="blueprint-row__body">
                <h4 class="blueprint-row__name">{{ group.name }}</h4>
                <p v-if="group.description" class="blueprint-row__description">
                  {{ group.description }}
                </p>
                <div class="blueprint-row__weights">
                  <span class="blueprint-row__weight-chip">
                    <i class="bi bi-people"></i>
                    <strong>{{ group.member_count }}</strong> {{ t('admin.groups.membersLabel') }}
                  </span>
                  <span v-if="!group.is_active" class="blueprint-row__weight-chip">
                    <i class="bi bi-eye-slash"></i>
                    {{ t('admin.groups.inactive') }}
                  </span>
                </div>
              </div>
              <div class="blueprint-row__actions">
                <BaseButton
                  variant="primary"
                  size="small"
                  @click="router.push(`/admin/groups/${group.id}`)"
                >
                  <i class="bi bi-pencil"></i> {{ t('admin.groups.manage') }}
                </BaseButton>
                <BaseButton
                  variant="danger"
                  size="small"
                  @click="confirmDelete(group)"
                >
                  <i class="bi bi-trash"></i>
                </BaseButton>
              </div>
            </div>
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

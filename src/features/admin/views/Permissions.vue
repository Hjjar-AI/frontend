<!-- frontend/src/features/admin/views/Permissions.vue -->
<template>
  <Layout>
    <div class="permissions-page">
      <PageHeader :title="t('admin.permissions.title')" icon="bi bi-shield-check">
        <template #badges>
          <BaseBadge variant="info">
            {{ t('admin.permissions.badgeCapabilities', { count: capabilityCatalog.length }) }}
          </BaseBadge>
          <BaseBadge variant="secondary">
            {{ t('admin.permissions.badgeRoles', { count: editableRoles.length }) }}
          </BaseBadge>
        </template>
      </PageHeader>

      <p class="permissions-page__intro">{{ t('admin.permissions.intro') }}</p>

      <ErrorBanner
        :error="catalogError"
        :retry="Boolean(catalogError)"
        @dismiss="catalogError = ''"
        @retry="loadCatalog"
      />

      <TabStrip v-model="activeTab" :tabs="tabs" :aria-label="t('admin.permissions.title')" />

      <BaseCard v-if="loadingCatalog" class="permissions-page__loading">
        <BaseSkeleton :count="6" height="40px" stacked />
      </BaseCard>

      <template v-else>
        <RoleCapabilityMatrix
          v-if="activeTab === 'roles'"
          :capability-catalog="capabilityCatalog"
          :capability-groups="capabilityGroups"
          :initial-role-caps="roleCaps"
          @role-caps-changed="onRoleCapsChanged"
        />
        <UserOverrideEditor
          v-else
          :capability-groups="capabilityGroups"
          :initial-user-id="initialUserId"
          @user-selected="onUserSelected"
        />
      </template>
    </div>
  </Layout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Layout from '@/components/common/Layout.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import TabStrip from '@/components/common/TabStrip.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseBadge from '@/components/base/BaseBadge.vue'
import BaseSkeleton from '@/components/base/BaseSkeleton.vue'
import ErrorBanner from '@/components/common/ErrorBanner.vue'
import RoleCapabilityMatrix from '../components/RoleCapabilityMatrix.vue'
import UserOverrideEditor from '../components/UserOverrideEditor.vue'
import { usePermissionStore } from '@/stores/permissionStore'
import { ROLES } from '@/utils/constants'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const permissionStore = usePermissionStore()

const activeTab = ref(route.query.user ? 'users' : 'roles')

const loadingCatalog = ref(false)
const catalogError = ref('')
const capabilityCatalog = computed(() => permissionStore.capabilityCatalog)
const capabilityGroups = computed(() => permissionStore.capabilityGroups)
const roleCaps = computed(() => permissionStore.roleCapabilities)

// Captured once at mount, not a live computed. The child reads it
// in its own `onMounted` and never re-reads it. A live computed
// would re-fire the child's prop with every URL change, and the
// child has no watch on the prop — so the two behaviours would
// silently diverge as soon as the child was edited to watch.
const initialUserId = ref(Number(route.query.user) || null)

const editableRoles = computed(() => [ROLES.MODERATOR, ROLES.MEMBER])

const tabs = computed(() => [
  { key: 'roles', label: t('admin.permissions.tabRoles'), icon: 'bi bi-people-fill' },
  { key: 'users', label: t('admin.permissions.tabUsers'), icon: 'bi bi-person-gear' },
])

async function loadCatalog() {
  loadingCatalog.value = true
  catalogError.value = ''
  const data = await permissionStore.fetchCatalog()
  if (!data) catalogError.value = permissionStore.error || t('admin.permissions.loadRolesFailed')
  loadingCatalog.value = false
}

function onRoleCapsChanged(value) {
  permissionStore.roleCapabilities = value
}

function onUserSelected(userId) {
  router.replace({
    query: userId ? { ...route.query, user: String(userId) } : { ...route.query, user: undefined },
  })
}

onMounted(loadCatalog)
</script>

<!-- frontend/src/features/admin/views/Permissions.vue -->
<template>
  <Layout>
    <PageShell
      :title="t('admin.permissions.title')"
      icon="bi bi-shield-check"
      :subtitle="t('admin.permissions.intro')"
      page-class="permissions-page"
    >
        <template #badges>
          <BaseBadge variant="info">
            {{ t('admin.permissions.badgeCapabilities', { count: capabilityCatalog.length }) }}
          </BaseBadge>
          <BaseBadge variant="secondary">
            {{ t('admin.permissions.badgeRoles', { count: editableRoles.length }) }}
          </BaseBadge>
        </template>
      <TabStrip v-model="activeTab" :tabs="tabs" :aria-label="t('admin.permissions.title')" />

      <AsyncContent
        :loading="loadingCatalog"
        :error="catalogError"
        :skeleton-count="6"
        skeleton-height="40px"
        @retry="loadCatalog"
      >
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
      </AsyncContent>
    </PageShell>
  </Layout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Layout from '@/components/common/Layout.vue'
import PageShell from '@/components/common/PageShell.vue'
import TabStrip from '@/components/common/TabStrip.vue'
import BaseBadge from '@/components/base/BaseBadge.vue'
import AsyncContent from '@/components/common/AsyncContent.vue'
import RoleCapabilityMatrix from '../components/RoleCapabilityMatrix.vue'
import UserOverrideEditor from '../components/UserOverrideEditor.vue'
import { usePermissionStore } from '@/stores/permissionStore'
import { ROLES } from '@/utils/constants'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const permissionStore = usePermissionStore()

const initialTab = route.query.tab === 'users' || route.query.user ? 'users' : 'roles'
const activeTab = ref(initialTab)

watch(activeTab, (tab) => {
  router.replace({
    query: {
      ...route.query,
      tab: tab === 'roles' ? undefined : tab,
      user: tab === 'users' ? route.query.user : undefined,
    },
  })
})

watch(() => route.query.tab, (tab) => {
  const next = tab === 'users' || route.query.user ? 'users' : 'roles'
  activeTab.value = next
})

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

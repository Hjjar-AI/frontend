<!-- frontend/src/features/admin/views/GroupDetail.vue -->
<!-- FEATURE #9 — admin group detail with member roster. -->
<template>
  <Layout>
    <PageShell
      :title="group?.name || t('admin.groups.detailTitle')"
      icon="bi bi-people-fill"
      page-class="groups-page"
    >
        <template #actions>
          <BaseButton variant="secondary" size="small" @click="router.push('/admin/groups')">
            <DirectionalIcon ltr="bi bi-arrow-left" rtl="bi bi-arrow-right" />
            {{ t('common.back') }}
          </BaseButton>
        </template>
      <ErrorBanner
        :error="groupStore.error"
        :retry="groupStore.error ? true : false"
        @dismiss="groupStore.error = null"
        @retry="loadGroup"
      />

      <BaseCard v-if="group">
        <h3 class="card-title">
          <i class="card-title__icon bi bi-info-circle"></i>
          {{ t('admin.groups.detailTitle') }}
        </h3>
        <FormGrid>
          <BaseInput v-model="editForm.name" :label="t('admin.groups.editName')" />
          <BaseInput v-model="editForm.description" :label="t('admin.groups.editDescription')" />
          <BaseCheckbox v-model="editForm.is_active" :label="t('admin.groups.editActive')" />
        </FormGrid>
        <div class="form-actions">
          <BaseButton variant="primary" @click="saveGroup" :loading="groupStore.isLoading">
            <i class="bi bi-check-lg"></i> {{ t('admin.groups.editSave') }}
          </BaseButton>
        </div>

        <hr class="group-detail__divider" />

        <div class="d-flex justify-between align-center flex-wrap gap-2 mb-2">
          <h3 class="card-title group-detail__members-title">
            <i class="card-title__icon bi bi-person-plus"></i>
            {{ t('admin.groups.membersTitle', { count: group.member_count }) }}
          </h3>
          <BaseButton variant="primary" size="small" @click="openAddModal">
            <i class="bi bi-plus-circle"></i> {{ t('admin.groups.addMembers') }}
          </BaseButton>
        </div>

        <div v-if="group.members && group.members.length" class="group-members-list">
          <div v-for="member in group.members" :key="member.id" class="group-member-row">
            <div
              class="group-member-row__avatar"
              :class="avatarToneClass(member.id ?? member.username)"
            >
              {{ (member.full_name || member.username || '?')[0] }}
            </div>
            <div class="group-member-row__info">
              <p class="group-member-row__name">{{ member.full_name || member.username }}</p>
              <p class="group-member-row__username">@{{ member.username }}</p>
            </div>
            <span v-if="!member.show_in_leaderboard" class="group-member-row__hidden">
              <i class="bi bi-eye-slash"></i> {{ t('admin.groups.hiddenFromLeaderboard') }}
            </span>
            <span v-if="member.current_streak > 0" class="group-member-row__streak">
              🔥 {{ member.current_streak }}
            </span>
            <button
              class="btn-icon text-danger"
              @click="removeMember(member)"
              :aria-label="t('admin.groups.removeMemberAria')"
              :title="t('admin.groups.removeMemberAria')"
            >
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
        </div>
        <BaseEmptyState
          v-else
          :title="t('admin.groups.emptyMembers')"
          :message="t('admin.groups.emptyMembersDesc')"
          icon="bi-person-plus"
        />
      </BaseCard>

      <!-- Add members modal -->
      <BaseModal
        :is-open="addModalOpen"
        :title="t('admin.groups.addMembers')"
        size="md"
        @update:is-open="addModalOpen = false"
      >
        <BaseInput
          v-model="memberSearch"
          :label="t('admin.groups.searchUsers')"
          :placeholder="t('admin.groups.searchUsersPlaceholder')"
        />
        <div class="group-members-picker">
          <div
            v-for="u in filteredAvailableUsers"
            :key="u.id"
            class="group-members-picker__row"
            @click="toggleUser(u.id)"
          >
            <BaseCheckbox
              :model-value="selectedUserIds.includes(u.id)"
              @update:model-value="toggleUser(u.id)"
            />
            <span class="group-members-picker__name">
              {{ u.full_name || u.username }}
              <small class="group-members-picker__meta">@{{ u.username }}</small>
            </span>
          </div>
          <BaseEmptyState
            v-if="filteredAvailableUsers.length === 0"
            :title="t('admin.groups.noAvailableUsers')"
            icon="bi-people"
          />
        </div>
        <template #footer>
          <BaseButton variant="secondary" @click="addModalOpen = false">{{
            t('common.cancel')
          }}</BaseButton>
          <BaseButton
            variant="primary"
            :disabled="selectedUserIds.length === 0"
            :loading="groupStore.isLoading"
            @click="submitAddMembers"
          >
            {{ t('admin.groups.addSelected', { count: selectedUserIds.length }) }}
          </BaseButton>
        </template>
      </BaseModal>
    </PageShell>
  </Layout>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Layout from '@/components/common/Layout.vue'
import PageShell from '@/components/common/PageShell.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseCheckbox from '@/components/base/BaseCheckbox.vue'
import BaseModal from '@/components/base/BaseModal.vue'
import BaseEmptyState from '@/components/base/BaseEmptyState.vue'
import FormGrid from '@/components/common/FormGrid.vue'
import ErrorBanner from '@/components/common/ErrorBanner.vue'
import { useGroupStore } from '@/stores/groupStore'
import { useUserStore } from '@/stores/userStore'
import { useDialog } from '@/composables/useDialog'
import { avatarToneClass } from '@/utils/avatar'

const { t } = useI18n()

const router = useRouter()
const route = useRoute()
const groupStore = useGroupStore()
const userStore = useUserStore()
const { confirm } = useDialog()

const groupId = computed(() => Number(route.params.id))
const group = computed(() => groupStore.adminCurrent)

const editForm = reactive({ name: '', description: '', is_active: true })

const addModalOpen = ref(false)
const allUsers = ref([])
const selectedUserIds = ref([])
const memberSearch = ref('')

// Backend `paginate()` in apps/core/utils.py clamps `per_page` to a
// maximum of 500. Requesting 1000 used to silently return at most 500
// while the store recorded 1000 in its local pagination state,
// desynchronising the picker from the server on installations with
// more than 500 users. The request now asks for exactly what the
// server will honour — see apps/core/utils.py, `paginate()`,
// `maximum=500`. Update both numbers together if the backend cap
// moves.
const USERS_PAGE_SIZE = 500

const currentMemberIds = computed(() => {
  if (!group.value?.members) return []
  return group.value.members.map((m) => m.user_id)
})

const availableUsers = computed(() =>
  allUsers.value.filter((u) => !currentMemberIds.value.includes(u.id)),
)

const filteredAvailableUsers = computed(() => {
  const q = memberSearch.value.trim().toLowerCase()
  if (!q) return availableUsers.value
  return availableUsers.value.filter(
    (u) =>
      (u.full_name || '').toLowerCase().includes(q) || (u.username || '').toLowerCase().includes(q),
  )
})

async function loadGroup() {
  await groupStore.fetchAdminGroup(groupId.value)
  if (group.value) {
    editForm.name = group.value.name
    editForm.description = group.value.description || ''
    editForm.is_active = group.value.is_active
  }
}

async function saveGroup() {
  const result = await groupStore.updateGroup(groupId.value, {
    name: editForm.name.trim(),
    description: editForm.description.trim(),
    is_active: editForm.is_active,
  })
  if (result) await loadGroup()
}

async function loadUsers() {
  const res = await userStore.fetchList({ per_page: USERS_PAGE_SIZE })
  allUsers.value = res ? [...userStore.items] : []
}

function openAddModal() {
  selectedUserIds.value = []
  memberSearch.value = ''
  addModalOpen.value = true
  if (allUsers.value.length === 0) loadUsers()
}

function toggleUser(id) {
  const idx = selectedUserIds.value.indexOf(id)
  if (idx === -1) selectedUserIds.value.push(id)
  else selectedUserIds.value.splice(idx, 1)
}

async function submitAddMembers() {
  if (selectedUserIds.value.length === 0) return
  const result = await groupStore.addMembers(groupId.value, selectedUserIds.value)
  if (result !== null) {
    addModalOpen.value = false
    await loadGroup()
  }
}

async function removeMember(member) {
  const name = member.full_name || member.username
  if (!(await confirm(t('admin.groups.removeMemberConfirm', { name })))) return
  await groupStore.removeMember(groupId.value, member.user_id)
  await loadGroup()
}

onMounted(() => {
  loadGroup()
  loadUsers()
})
</script>

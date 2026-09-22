<!-- frontend/src/features/admin/components/UserOverrideEditor.vue -->
<!--
  Per-user capability override editor.

  Extracted from `Permissions.vue` (Finding 1a). Owns the entire
  override workflow:

    • the searchable user list
    • the currently-selected user and their role-granted caps
    • the saved overrides and the working draft
    • tri-state toggles (inherit / force-on / force-off)
    • save / discard
    • URL sync via the `user-selected` event (parent owns the actual
      router.replace)

  The parent supplies `capabilityGroups` and the `initialUserId`
  captured from `?user=<id>`. The controller loads the user list
  through `userStore`, independent of the catalog fetch.
-->
<template>
  <div class="user-override-editor">
    <ErrorBanner :error="error" :retry="Boolean(error)" @dismiss="error = ''" />

    <!-- ── User picker ──────────────────────────────────────────── -->
    <BaseCard class="user-picker-card">
      <div class="user-picker">
        <BaseInput
          v-model="userSearch"
          :label="t('admin.permissions.userSearchLabel')"
          :placeholder="t('admin.permissions.userSearchPlaceholder')"
        />
        <div v-if="usersLoading" class="user-picker__loading">
          <BaseSkeleton :count="3" height="32px" stacked />
        </div>
        <div v-else class="user-picker__list">
          <button
            v-for="u in filteredUsers"
            :key="u.id"
            type="button"
            class="user-picker__item"
            :class="{ 'user-picker__item--active': selectedUser && selectedUser.id === u.id }"
            @click="selectUser(u)"
          >
            <span
              class="user-picker__avatar"
              :class="avatarToneClass(u.id ?? u.username)"
            >
              {{ (u.full_name || u.username || '?')[0] }}
            </span>
            <span class="user-picker__identity">
              <span class="user-picker__name">
                {{ u.full_name || u.username }}
              </span>
              <span class="user-picker__role">
                {{ roleLabel(u.role) }}
              </span>
            </span>
          </button>
          <p v-if="filteredUsers.length === 0" class="text-muted">
            {{ t('admin.permissions.userSearchEmpty') }}
          </p>
        </div>
      </div>
    </BaseCard>

    <!-- ── Override editor ──────────────────────────────────────── -->
    <BaseCard v-if="selectedUser && !userLoading" class="override-editor-card">
      <div class="override-editor__header">
        <div>
          <h3 class="override-editor__title">
            {{ selectedUser.full_name || selectedUser.username }}
            <span class="override-editor__role-badge">
              {{ roleLabel(selectedUser.role) }}
            </span>
          </h3>
          <p class="override-editor__hint">
            {{
              t('admin.permissions.overrideHint', {
                role: roleLabel(selectedUser.role),
              })
            }}
          </p>
        </div>
        <div class="override-editor__actions">
          <span v-if="hasUserChanges" class="role-header__dirty">
            <i class="bi bi-exclamation-circle"></i>
            {{ t('admin.permissions.unsavedChanges') }}
          </span>
          <BaseButton
            v-if="hasUserChanges"
            variant="secondary"
            size="small"
            @click="discardUserChanges"
          >
            {{ t('common.discard') }}
          </BaseButton>
          <BaseButton
            variant="primary"
            size="small"
            :loading="savingUser"
            :disabled="!hasUserChanges || savingUser"
            @click="saveUserOverrides"
          >
            <i class="bi bi-check-lg"></i> {{ t('common.save') }}
          </BaseButton>
        </div>
      </div>

      <div class="override-legend">
        <span class="override-legend__item override-legend__item--inherit">
          <i class="bi bi-circle"></i> {{ t('admin.permissions.stateInherit') }}
        </span>
        <span class="override-legend__item override-legend__item--on">
          <i class="bi bi-check-circle-fill"></i> {{ t('admin.permissions.stateOn') }}
        </span>
        <span class="override-legend__item override-legend__item--off">
          <i class="bi bi-x-circle-fill"></i> {{ t('admin.permissions.stateOff') }}
        </span>
      </div>

      <BaseCard v-for="group in capabilityGroups" :key="group.label" class="capability-group-card">
        <h4 class="capability-group-card__title">
          <i class="bi bi-folder2-open"></i> {{ group.label }}
        </h4>
        <div class="capability-list">
          <div
            v-for="cap in group.capabilities"
            :key="cap"
            class="capability-row capability-row--tri"
          >
            <div class="capability-row__info">
              <span class="capability-row__name">{{ cap }}</span>
              <span class="capability-row__desc">
                {{ describeCapability(cap) }}
                <span
                  v-if="roleHasCapability(cap)"
                  class="capability-row__role-tag capability-row__role-tag--on"
                >
                  <i class="bi bi-people-fill"></i>
                  {{ t('admin.permissions.grantedByRole') }}
                </span>
                <span v-else class="capability-row__role-tag capability-row__role-tag--off">
                  {{ t('admin.permissions.notGrantedByRole') }}
                </span>
              </span>
            </div>
            <div class="capability-row__tri">
              <button
                type="button"
                class="tri-button tri-button--inherit"
                :class="{ 'tri-button--active': overrideState(cap) === 'inherit' }"
                @click="setOverride(cap, null)"
                :title="t('admin.permissions.stateInherit')"
              >
                <i class="bi bi-circle"></i>
              </button>
              <button
                type="button"
                class="tri-button tri-button--on"
                :class="{ 'tri-button--active': overrideState(cap) === 'on' }"
                @click="setOverride(cap, true)"
                :title="t('admin.permissions.stateOn')"
              >
                <i class="bi bi-check-circle-fill"></i>
              </button>
              <button
                type="button"
                class="tri-button tri-button--off"
                :class="{ 'tri-button--active': overrideState(cap) === 'off' }"
                @click="setOverride(cap, false)"
                :title="t('admin.permissions.stateOff')"
              >
                <i class="bi bi-x-circle-fill"></i>
              </button>
            </div>
          </div>
        </div>
      </BaseCard>
    </BaseCard>

    <BaseCard v-else-if="!selectedUser && !userLoading" class="empty-hint-card">
      <BaseEmptyState
        :title="t('admin.permissions.userSelectEmpty')"
        :message="t('admin.permissions.userSelectEmptyDesc')"
        icon="bi-person-gear"
      />
    </BaseCard>
  </div>
</template>

<script setup>
import BaseCard from '@/components/base/BaseCard.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseSkeleton from '@/components/base/BaseSkeleton.vue'
import BaseEmptyState from '@/components/base/BaseEmptyState.vue'
import ErrorBanner from '@/components/common/ErrorBanner.vue'
import { useUserOverrideEditor } from '../composables/useUserOverrideEditor'
import { avatarToneClass } from '@/utils/avatar'

const props = defineProps({
  capabilityGroups: { type: Array, required: true },
  initialUserId: { type: Number, default: null },
})

const emit = defineEmits(['user-selected'])

const {
  t,
  usersLoading,
  userSearch,
  selectedUser,
  userLoading,
  savingUser,
  error,
  filteredUsers,
  hasUserChanges,
  roleLabel,
  describeCapability,
  selectUser,
  roleHasCapability,
  overrideState,
  setOverride,
  saveUserOverrides,
  discardUserChanges,
} = useUserOverrideEditor(props, emit)
</script>

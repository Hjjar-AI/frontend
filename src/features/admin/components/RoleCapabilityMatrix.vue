<!-- frontend/src/features/admin/components/RoleCapabilityMatrix.vue -->
<!--
  Role-capability matrix.

  Extracted from `Permissions.vue` (Finding 1a). Owns the entire
  role-editing workflow:

    • which role is currently being edited (`activeRole`)
    • the server-canonical capability set per role (`roleCaps`)
    • the working draft the admin is editing (`draftRoleCaps`)
    • the dirty check between the two (`hasRoleChanges`)
    • save / discard
    • the "unsaved changes" indicator and buttons

  The parent view supplies the catalog and the initial role caps
  from a single `permissionStore.fetchCatalog()` call. On save, this
  component emits `role-caps-changed` with the newly-updated map so
  the parent's `roleCaps` ref — and, by extension, this component's
  `initialRoleCaps` prop on next mount — reflects the change.
-->
<template>
  <div class="role-matrix">
    <!--
      Local error surface, matching the original Permissions.vue.
      The parent's ErrorBanner covers catalog-fetch failures; this
      banner covers role-save failures. The two are independent.
    -->
    <ErrorBanner :error="error" :retry="Boolean(error)" @dismiss="error = ''" />

    <!-- ── Role picker ──────────────────────────────────────────── -->
    <div class="role-picker">
      <button
        v-for="role in editableRoles"
        :key="role"
        type="button"
        class="role-chip"
        :class="{ 'role-chip--active': activeRole === role }"
        @click="activeRole = role"
      >
        <i :class="roleIcon(role)"></i>
        {{ roleLabel(role) }}
        <span class="role-chip__count">
          {{ (draftRoleCaps[role] || []).length }}
        </span>
      </button>

      <button
        type="button"
        class="role-chip role-chip--readonly"
        :class="{ 'role-chip--active': activeRole === 'admin' }"
        @click="activeRole = 'admin'"
      >
        <i class="bi bi-shield-lock-fill"></i>
        {{ roleLabel('admin') }}
        <span class="role-chip__count">{{ capabilityCatalog.length }}</span>
      </button>
    </div>

    <!-- ── Current-role header ──────────────────────────────────── -->
    <div class="role-header">
      <div class="role-header__info">
        <h3 class="role-header__title">
          {{ roleLabel(activeRole) }}
          <span v-if="activeRole === 'admin'" class="role-header__readonly-tag">
            {{ t('admin.permissions.readOnlyTag') }}
          </span>
        </h3>
        <p class="role-header__hint">
          {{
            activeRole === 'admin'
              ? t('admin.permissions.adminHint')
              : t('admin.permissions.roleHint')
          }}
        </p>
      </div>

      <div v-if="activeRole !== 'admin'" class="role-header__actions">
        <span v-if="hasRoleChanges" class="role-header__dirty">
          <i class="bi bi-exclamation-circle"></i>
          {{ t('admin.permissions.unsavedChanges') }}
        </span>
        <BaseButton
          v-if="hasRoleChanges"
          variant="secondary"
          size="small"
          @click="discardRoleChanges"
        >
          {{ t('common.discard') }}
        </BaseButton>
        <BaseButton
          variant="primary"
          size="small"
          :loading="savingRole"
          :disabled="!hasRoleChanges || savingRole"
          @click="saveActiveRole"
        >
          <i class="bi bi-check-lg"></i> {{ t('common.save') }}
        </BaseButton>
      </div>
    </div>

    <!-- ── Capability matrix ────────────────────────────────────── -->
    <BaseCard v-for="group in capabilityGroups" :key="group.label" class="capability-group-card">
      <h4 class="capability-group-card__title">
        <i class="bi bi-folder2-open"></i> {{ group.label }}
      </h4>
      <div class="capability-list">
        <label
          v-for="cap in group.capabilities"
          :key="cap"
          class="capability-row"
          :class="{ 'capability-row--disabled': activeRole === 'admin' }"
        >
          <div class="capability-row__info">
            <span class="capability-row__name">{{ cap }}</span>
            <span class="capability-row__desc">{{ describeCapability(cap) }}</span>
          </div>
          <div class="capability-row__toggle">
            <BaseCheckbox
              :model-value="isCapabilityOn(activeRole, cap)"
              :disabled="activeRole === 'admin'"
              @update:model-value="toggleCapability(activeRole, cap, $event)"
            />
          </div>
        </label>
      </div>
    </BaseCard>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseCheckbox from '@/components/base/BaseCheckbox.vue'
import ErrorBanner from '@/components/common/ErrorBanner.vue'
import { usePermissionStore } from '@/stores/permissionStore'
import { useNotify } from '@/composables/useNotify'
import { ROLES } from '@/utils/constants'
import { roleIconFor, roleLabelFor } from '@/utils/roleDisplay'

const { t } = useI18n()
const { notify } = useNotify()
const permissionStore = usePermissionStore()

const props = defineProps({
  // Flat capability list. Only used for the admin chip's count.
  capabilityCatalog: { type: Array, required: true },
  // Grouped list — [{ label, capabilities: [...] }].
  capabilityGroups: { type: Array, required: true },
  // Role → caps map, as returned by `listRoles()`. Read once at
  // setup; the child owns the draft from that point on.
  initialRoleCaps: { type: Object, required: true },
})

const emit = defineEmits(['role-caps-changed'])

const editableRoles = computed(() => [ROLES.MODERATOR, ROLES.MEMBER])

// ── Local state ───────────────────────────────────────────────────
const roleCaps = ref(
  Object.fromEntries(
    Object.entries(props.initialRoleCaps).map(([role, caps]) => [role, [...(caps || [])].sort()]),
  ),
)

const draftRoleCaps = ref(
  Object.fromEntries(Object.entries(roleCaps.value).map(([role, caps]) => [role, [...caps]])),
)

const activeRole = ref(ROLES.MODERATOR)

// Fallback: if the current default role is not present in the
// payload, switch to the first editable role that is.
if (!draftRoleCaps.value[activeRole.value] && activeRole.value !== 'admin') {
  const first = editableRoles.value.find((r) => draftRoleCaps.value[r])
  activeRole.value = first || ROLES.MODERATOR
}

const savingRole = ref(false)
const error = ref('')

const hasRoleChanges = computed(() => {
  if (activeRole.value === 'admin') return false
  const saved = roleCaps.value[activeRole.value] || []
  const draft = draftRoleCaps.value[activeRole.value] || []
  if (saved.length !== draft.length) return true
  const savedSet = new Set(saved)
  return draft.some((c) => !savedSet.has(c))
})

function roleLabel(role) {
  return roleLabelFor(role, t)
}

function roleIcon(role) {
  return roleIconFor(role)
}

function describeCapability(cap) {
  const key = `admin.permissions.capability.${cap}`
  const value = t(key)
  return value === key ? '' : value
}

function isCapabilityOn(role, cap) {
  return (draftRoleCaps.value[role] || []).includes(cap)
}

function toggleCapability(role, cap, on) {
  if (role === 'admin') return
  const current = new Set(draftRoleCaps.value[role] || [])
  if (on) current.add(cap)
  else current.delete(cap)
  draftRoleCaps.value = {
    ...draftRoleCaps.value,
    [role]: [...current].sort(),
  }
}

async function saveActiveRole() {
  if (activeRole.value === 'admin') return
  savingRole.value = true
  error.value = ''
  try {
    const caps = draftRoleCaps.value[activeRole.value] || []
    const result = await permissionStore.updateRole(activeRole.value, caps)
    if (!result && permissionStore.status === 'error') {
      throw new Error(permissionStore.error || t('admin.permissions.saveFailed'))
    }
    roleCaps.value = {
      ...roleCaps.value,
      [activeRole.value]: [...caps],
    }
    emit('role-caps-changed', { ...roleCaps.value })
    notify(t('admin.permissions.roleSaved', { role: roleLabel(activeRole.value) }), 'success')
  } catch (e) {
    error.value = e?.message || t('admin.permissions.saveFailed')
  } finally {
    savingRole.value = false
  }
}

function discardRoleChanges() {
  if (activeRole.value === 'admin') return
  const saved = roleCaps.value[activeRole.value] || []
  draftRoleCaps.value = {
    ...draftRoleCaps.value,
    [activeRole.value]: [...saved],
  }
}
</script>

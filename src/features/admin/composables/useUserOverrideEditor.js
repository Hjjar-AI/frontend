import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePermissionStore } from '@/stores/permissionStore'
import { useUserStore } from '@/stores/userStore'
import { useNotify } from '@/composables/useNotify'
import { roleLabelFor } from '@/utils/roleDisplay'

export function useUserOverrideEditor(props, emit) {
  const { t } = useI18n()
  const { notify } = useNotify()
  const permissionStore = usePermissionStore()
  const userStore = useUserStore()

  const users = computed(() => userStore.items)
  const usersLoading = computed(() => userStore.isLoading)
  const userSearch = ref('')
  const selectedUser = ref(null)
  const userLoading = ref(false)
  const savingUser = ref(false)
  const error = ref('')
  const userOverridesSaved = ref({})
  const userOverridesDraft = ref({})
  const selectedUserRoleCaps = ref(new Set())

  const filteredUsers = computed(() => {
    const query = userSearch.value.trim().toLowerCase()
    if (!query) return users.value.slice(0, 50)
    return users.value
      .filter(
        (user) =>
          (user.username || '').toLowerCase().includes(query) ||
          (user.full_name || '').toLowerCase().includes(query),
      )
      .slice(0, 50)
  })

  const hasUserChanges = computed(() => {
    const saved = userOverridesSaved.value
    const draft = userOverridesDraft.value
    const savedKeys = Object.keys(saved)
    const draftKeys = Object.keys(draft)
    if (savedKeys.length !== draftKeys.length) return true
    return savedKeys.some((key) => saved[key] !== draft[key])
  })

  function roleLabel(role) {
    return roleLabelFor(role, t)
  }

  function describeCapability(capability) {
    const key = `admin.permissions.capability.${capability}`
    const value = t(key)
    return value === key ? '' : value
  }

  async function loadUsers() {
    await userStore.fetchList({ per_page: 500 })
  }

  async function selectUser(user) {
    selectedUser.value = user
    userLoading.value = true
    error.value = ''
    const data = await permissionStore.fetchUserCapabilities(user.id)
    if (data) {
      selectedUserRoleCaps.value = new Set(data.role_capabilities || [])
      const overrides = data.overrides || {}
      userOverridesSaved.value = { ...overrides }
      userOverridesDraft.value = { ...overrides }
    } else {
      error.value = permissionStore.error || t('admin.permissions.loadUserFailed')
      selectedUser.value = null
    }
    userLoading.value = false
  }

  function roleHasCapability(capability) {
    return selectedUserRoleCaps.value.has(capability)
  }

  function overrideState(capability) {
    const value = userOverridesDraft.value[capability]
    if (value === true) return 'on'
    if (value === false) return 'off'
    return 'inherit'
  }

  function setOverride(capability, value) {
    const next = { ...userOverridesDraft.value }
    if (value === null) delete next[capability]
    else next[capability] = value
    userOverridesDraft.value = next
  }

  async function saveUserOverrides() {
    if (!selectedUser.value) return
    savingUser.value = true
    error.value = ''
    const overrides = userOverridesDraft.value
    const result = await permissionStore.updateUserCapabilities(selectedUser.value.id, overrides)
    if (result || permissionStore.status !== 'error') {
      userOverridesSaved.value = { ...overrides }
      notify(
        t('admin.permissions.userSaved', {
          name: selectedUser.value.full_name || selectedUser.value.username,
        }),
        'success',
      )
    } else {
      error.value = permissionStore.error || t('admin.permissions.saveFailed')
    }
    savingUser.value = false
  }

  function discardUserChanges() {
    userOverridesDraft.value = { ...userOverridesSaved.value }
  }

  watch(selectedUser, (user) => emit('user-selected', user?.id || null))

  onMounted(async () => {
    await loadUsers()
    if (!props.initialUserId) return
    const match = users.value.find((user) => user.id === props.initialUserId)
    if (match) await selectUser(match)
  })

  return {
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
  }
}

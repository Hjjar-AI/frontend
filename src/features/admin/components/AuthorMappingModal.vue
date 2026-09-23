<!-- frontend/src/features/admin/components/AuthorMappingModal.vue -->
<!--
  Per-import author-mapping prompt.

  Opened by StateImport.vue after the analyze phase returns one or
  more unknown author names. The admin decides, per name, whether
  the envelope's questions should be attributed to:

    • an existing local user (dropdown),
    • a newly-created stub user, or
    • no one (authored_by = NULL; the questions are still owned by
      the importing admin).

  The modal is controlled by its parent and emits `confirm` with
  `{ [name]: { action: 'user'|'stub'|'null', user_id?: number } }`.
  Keeping the workflow declarative avoids retaining a caller-owned
  Promise resolver inside the child component.

  OWNERSHIP IS NOT CHOSEN HERE. Every imported question is owned by
  the acting admin — that is the design decision that lets "Unknown
  author" be a valid non-broken state. The modal only decides
  authorship.
-->
<template>
  <BaseModal
    :is-open="isOpen"
    :title="t('admin.import.mappingTitle')"
    size="lg"
    :dismissable="false"
    static-backdrop
    @update:is-open="onModalClose"
  >
    <p class="author-mapping__intro">
      <i class="bi bi-info-circle"></i>
      {{ t('admin.import.mappingIntro', { count: authors.length }) }}
    </p>

    <div class="author-mapping__list">
      <div v-for="author in authors" :key="author.name" class="author-mapping__row">
        <div class="author-mapping__header">
          <div class="author-mapping__identity">
            <i class="bi bi-person-circle"></i>
            <span class="author-mapping__name">{{ author.name }}</span>
            <span v-if="author.question_count" class="author-mapping__count">
              {{ t('admin.import.mappingQuestionCount', { count: author.question_count }) }}
            </span>
            <span v-if="author.case_count" class="author-mapping__count">
              {{ t('admin.import.mappingCaseCount', { count: author.case_count }) }}
            </span>
          </div>
          <span v-if="author.uuid" class="author-mapping__uuid" :title="author.uuid">
            {{ shortUuid(author.uuid) }}
          </span>
        </div>

        <div class="author-mapping__options">
          <label
            class="author-mapping__option"
            :class="{ 'author-mapping__option--disabled': !usersAvailable }"
          >
            <input
              type="radio"
              :name="`map-${author.name}`"
              value="user"
              :disabled="!usersAvailable"
              :checked="decisions[author.name].action === 'user'"
              @change="setAction(author.name, 'user')"
            />
            <span class="author-mapping__option-label">
              {{ t('admin.import.mappingActionUser') }}
            </span>
          </label>
          <div v-if="decisions[author.name].action === 'user'" class="author-mapping__user-picker">
            <BaseSelect
              :model-value="decisions[author.name].user_id || ''"
              :options="userOptions"
              :placeholder="t('admin.import.mappingPickUser')"
              @update:model-value="setUser(author.name, $event)"
            />
          </div>

          <label class="author-mapping__option">
            <input
              type="radio"
              :name="`map-${author.name}`"
              value="stub"
              :checked="decisions[author.name].action === 'stub'"
              @change="setAction(author.name, 'stub')"
            />
            <span class="author-mapping__option-label">
              {{ t('admin.import.mappingActionStub') }}
              <small class="author-mapping__hint">
                {{ t('admin.import.mappingActionStubHint') }}
              </small>
            </span>
          </label>

          <label class="author-mapping__option">
            <input
              type="radio"
              :name="`map-${author.name}`"
              value="null"
              :checked="decisions[author.name].action === 'null'"
              @change="setAction(author.name, 'null')"
            />
            <span class="author-mapping__option-label">
              {{ t('admin.import.mappingActionNull') }}
              <small class="author-mapping__hint">
                {{ t('admin.import.mappingActionNullHint') }}
              </small>
            </span>
          </label>
        </div>
      </div>
    </div>

    <p v-if="!usersAvailable" class="author-mapping__warning">
      <i class="bi bi-exclamation-triangle"></i>
      {{ t('admin.import.mappingUsersUnavailable') }}
    </p>

    <template #footer>
      <BaseButton variant="secondary" @click="cancel">
        {{ t('common.cancel') }}
      </BaseButton>
      <BaseButton variant="primary" :disabled="!allDecided" @click="confirmMapping">
        <i class="bi bi-check-lg"></i>
        {{ t('admin.import.mappingConfirm') }}
      </BaseButton>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import BaseModal from '@/components/base/BaseModal.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseButton from '@/components/base/BaseButton.vue'

const { t } = useI18n()

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  authors: { type: Array, default: () => [] },
  users: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:isOpen', 'confirm', 'cancel'])

const decisions = ref({})

const usersAvailable = computed(() => props.users.length > 0)

const userOptions = computed(() =>
  props.users.map((u) => ({
    value: u.id,
    label: u.full_name ? `${u.full_name} (@${u.username})` : `@${u.username}`,
  })),
)

// A decision is "made" once the row has an action AND, if the
// action is 'user', a target. Rows default to 'null' so an admin
// who accepts everything can confirm immediately — but the button
// stays disabled while any row is on 'user' without a picked target.
const allDecided = computed(() => {
  for (const name of Object.keys(decisions.value)) {
    const d = decisions.value[name]
    if (!d.action) return false
    if (d.action === 'user' && !d.user_id) return false
  }
  return true
})

function shortUuid(uuid) {
  if (!uuid) return ''
  return uuid.slice(0, 8)
}

function setAction(name, action) {
  decisions.value = {
    ...decisions.value,
    [name]: {
      action,
      // Keep any previously-chosen user id when toggling back to
      // 'user' — the admin may have switched away by accident.
      user_id: action === 'user' ? decisions.value[name]?.user_id || null : null,
    },
  }
}

function setUser(name, userId) {
  decisions.value = {
    ...decisions.value,
    [name]: {
      action: 'user',
      user_id: userId,
    },
  }
}

function confirmMapping() {
  if (!allDecided.value) return
  const result = {}
  for (const [name, d] of Object.entries(decisions.value)) {
    if (d.action === 'user') {
      result[name] = { action: 'user', user_id: d.user_id }
    } else {
      result[name] = { action: d.action }
    }
  }
  emit('confirm', result)
  emit('update:isOpen', false)
}

function cancel() {
  emit('cancel')
  emit('update:isOpen', false)
}

// BaseModal emits update:is-open when its close button or backdrop
// is used. Because the modal is non-dismissable in the template,
// this only fires from the footer buttons — but wiring it here
// keeps the flow correct if the modal is ever made dismissable.
function onModalClose(open) {
  if (open) {
    emit('update:isOpen', true)
    return
  }
  cancel()
}

function resetDecisions() {
  const initial = {}
  for (const a of props.authors) {
    initial[a.name] = { action: 'null', user_id: null }
  }
  decisions.value = initial
}

watch(
  [() => props.isOpen, () => props.authors],
  ([open]) => {
    if (open) resetDecisions()
  },
  { immediate: true, deep: true },
)
</script>

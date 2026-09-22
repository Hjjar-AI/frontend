<!-- frontend/src/features/admin/components/GroupFormModal.vue -->

<template>
  <BaseModal
    :is-open="isOpen"
    :title="t('admin.groups.createTitle')"
    size="sm"
    @update:is-open="close"
  >
    <form @submit.prevent="submit">
      <FormGrid>
        <BaseInput v-model="form.name" :label="t('admin.groups.createName')" required />
        <BaseInput v-model="form.description" :label="t('admin.groups.createDescription')" />
      </FormGrid>
      <div class="form-actions">
        <BaseButton type="button" variant="secondary" @click="close">{{ t('common.cancel') }}</BaseButton>
        <BaseButton type="submit" variant="primary" :loading="groupStore.isLoading">{{ t('admin.groups.create') }}</BaseButton>
      </div>
    </form>
  </BaseModal>
</template>

<script setup>
import { ref, reactive } from 'vue'
import BaseModal from '@/components/base/BaseModal.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import FormGrid from '@/components/common/FormGrid.vue'
import { useGroupStore } from '@/stores/groupStore'

const { t } = useI18n()

const emit = defineEmits(['saved'])

const groupStore = useGroupStore()

const isOpen = ref(false)

const form = reactive({
  name: '',
  description: '',
})

// Public API — see the sibling BlueprintFormModal for the
// conventions. No argument: this modal is create-only.
function open() {
  form.name = ''
  form.description = ''
  isOpen.value = true
}

function close() {
  isOpen.value = false
}

async function submit() {
  if (!form.name.trim()) return
  const result = await groupStore.createGroup({
    name: form.name.trim(),
    description: form.description.trim(),
  })
  if (result) {
    close()
    emit('saved')
  }
}

defineExpose({ open, close })
</script>
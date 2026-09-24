<template>
  <BaseModal
    :is-open="isOpen"
    :title="t('admin.import.conflictReviewTitle')"
    size="xl"
    :dismissable="false"
    static-backdrop
    @update:is-open="onModalClose"
  >
    <p class="author-mapping__intro">
      <i class="bi bi-intersect"></i>
      {{ t('admin.import.conflictReviewIntro', { count: conflicts.length }) }}
    </p>

    <div class="author-mapping__list">
      <div v-for="conflict in conflicts" :key="conflict.uuid" class="author-mapping__row">
        <div class="author-mapping__header">
          <div class="author-mapping__identity">
            <strong>{{ conflict.local_question }}</strong>
            <span class="author-mapping__uuid">{{ conflict.uuid.slice(0, 8) }}</span>
          </div>
        </div>
        <p v-if="conflict.imported_question !== conflict.local_question" class="text-muted">
          {{ t('admin.import.conflictImportedText') }}: {{ conflict.imported_question }}
        </p>
        <p class="text-muted">
          {{ t('admin.import.conflictChangedFields') }}:
          {{ conflict.changed_fields.join(', ') }}
        </p>
        <div class="author-mapping__options">
          <BaseRadio
            class="author-mapping__option"
            :model-value="decisions[conflict.uuid]"
            :name="`conflict-${conflict.uuid}`"
            value="keep_local"
            @update:model-value="setDecision(conflict.uuid, $event)"
          >
            <span>{{ t('admin.import.conflictKeepLocal') }}</span>
          </BaseRadio>
          <BaseRadio
            class="author-mapping__option"
            :model-value="decisions[conflict.uuid]"
            :name="`conflict-${conflict.uuid}`"
            value="use_imported"
            @update:model-value="setDecision(conflict.uuid, $event)"
          >
            <span>{{ t('admin.import.conflictUseImported') }}</span>
          </BaseRadio>
        </div>
      </div>
    </div>

    <template #footer>
      <BaseButton variant="secondary" @click="cancel">{{ t('common.cancel') }}</BaseButton>
      <BaseButton variant="primary" @click="confirmDecisions">
        <i class="bi bi-check-lg"></i>
        {{ t('admin.import.conflictContinue') }}
      </BaseButton>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref, watch } from 'vue'
import BaseModal from '@/components/base/BaseModal.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseRadio from '@/components/base/BaseRadio.vue'

const { t } = useI18n()

const props = defineProps({
  isOpen: { type: Boolean, default: false },
  conflicts: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:isOpen', 'confirm', 'cancel'])
const decisions = ref({})

function reset() {
  decisions.value = Object.fromEntries(
    props.conflicts.map((conflict) => [conflict.uuid, 'keep_local']),
  )
}

function setDecision(uuid, value) {
  decisions.value = { ...decisions.value, [uuid]: value }
}

function confirmDecisions() {
  emit('confirm', { ...decisions.value })
  emit('update:isOpen', false)
}

function cancel() {
  emit('cancel')
  emit('update:isOpen', false)
}

function onModalClose(open) {
  if (!open) cancel()
}

watch([() => props.isOpen, () => props.conflicts], ([open]) => {
  if (open) reset()
}, { immediate: true, deep: true })
</script>

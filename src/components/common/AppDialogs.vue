<!-- frontend/src/components/common/AppDialogs.vue -->
<template>
  <BaseModal
    :is-open="dialogState.confirmVisible"
    :title="confirmTitle"
    :role="confirmRole"
    :static-backdrop="confirmStatic"
    size="sm"
    @update:is-open="resolveConfirm(false)"
  >
    <div class="dialog-content">
      <div class="dialog-icon" :class="confirmVariant">
        <i :class="confirmIcon"></i>
      </div>
      <p class="dialog-message">{{ dialogState.confirmMessage }}</p>
    </div>
    <template #footer>
      <BaseButton variant="secondary" @click="resolveConfirm(false)">{{ t('common.cancel') }}</BaseButton>
      <BaseButton :variant="confirmVariant === 'danger' ? 'danger' : 'primary'" @click="resolveConfirm(true)">{{ t('common.yes') }}</BaseButton>
    </template>
  </BaseModal>

  <BaseModal
    :is-open="dialogState.promptVisible"
    :title="t('ui.promptTitle')"
    size="sm"
    @update:is-open="resolvePrompt(null)"
  >
    <p class="dialog-message">{{ dialogState.promptMessage }}</p>

    <BaseInput
      v-model="promptInput"
      placeholder=""
      class="dialog-input"
      ref="promptInputRef"
      @enter="submitPrompt"
    />
    <template #footer>
      <BaseButton variant="secondary" @click="resolvePrompt(null)">{{ t('common.cancel') }}</BaseButton>
      <BaseButton variant="primary" @click="submitPrompt">{{ t('common.ok') }}</BaseButton>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref, watch, nextTick, computed } from 'vue'
import BaseModal from '@/components/base/BaseModal.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import { useDialog } from '@/composables/useDialog'


const { t } = useI18n()

const { dialogState, resolveConfirm, resolvePrompt } = useDialog()

const promptInput = ref('')
const promptInputRef = ref(null)

const confirmVariant = computed(() => dialogState.confirmVariant || 'default')

const confirmTitle = computed(() => {
  if (confirmVariant.value === 'danger') return t('ui.warningTitle')
  if (confirmVariant.value === 'warning') return t('ui.alertTitle')
  return t('ui.confirmTitle')
})

const confirmRole = computed(() => confirmVariant.value === 'danger' ? 'alertdialog' : 'dialog')
const confirmStatic = computed(() => confirmVariant.value === 'danger')

const confirmIcon = computed(() => {
  if (confirmVariant.value === 'danger') return 'bi bi-exclamation-triangle'
  if (confirmVariant.value === 'warning') return 'bi bi-exclamation-circle'
  return 'bi bi-question-circle'
})

watch(
  () => dialogState.promptVisible,
  (val) => {
    if (val) {
      promptInput.value = dialogState.promptDefault

      nextTick(() => {
        promptInputRef.value?.focus()
      })
    }
  }
)

function submitPrompt() {
  resolvePrompt(promptInput.value)
}
</script>
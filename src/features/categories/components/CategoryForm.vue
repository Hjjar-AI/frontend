<!-- frontend/src/features/categories/components/CategoryForm.vue -->
<template>
  <BaseModal
    :is-open="isOpen"
    :title="editMode ? t('categories.editTitle') : t('categories.addTitle')"
    size="md"
    @update:is-open="close"
  >
    <form @submit.prevent="handleSubmit" class="category-form">
      <FormGrid>
        <BaseInput
          v-model="form.name"
          :label="t('categories.nameLabel')"
          required
          :error="nameError"
          @input="nameError = ''"
        />
        <BaseInput v-model="form.description" :label="t('categories.descriptionLabel')" />
        <BaseField :label="t('categories.colorLabel')" id="cat-color">
          <div class="category-form__presets">
            <button
              v-for="c in colorPresets"
              :key="c"
              type="button"
              class="category-form__preset"
              :style="{ background: c }"
              @click="form.color = c"
              :class="{ 'category-form__preset--active': form.color === c }"
              :aria-label="t('categories.colorPresetAria', { color: c })"
            >
              <span v-if="form.color === c" class="category-form__preset-check"><i class="bi bi-check-lg"></i></span>
            </button>
            <input
              type="color"
              v-model="form.color"
              class="category-form__custom-input"
              :aria-label="t('categories.customColorAria')"
            />
          </div>
        </BaseField>
        <BaseSelect v-model="form.icon" :label="t('categories.iconLabel')" :options="iconOptions" />
      </FormGrid>
      <div class="form-actions">
        <BaseButton type="button" variant="secondary" @click="close"><i class="bi bi-x-lg"></i> {{ t('common.cancel') }}</BaseButton>
        <BaseButton type="submit" variant="primary" :loading="categoryStore.isLoading"><i class="bi bi-check-lg"></i> {{ editMode ? t('categories.updateButtonLabel') : t('categories.addButtonLabel') }}</BaseButton>
      </div>
    </form>
  </BaseModal>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import BaseModal from '@/components/base/BaseModal.vue'
import BaseField from '@/components/base/BaseField.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import FormGrid from '@/components/common/FormGrid.vue'
import { useCategoryStore } from '@/stores/categoryStore'

const { t } = useI18n()

const categoryStore = useCategoryStore()

const isOpen = ref(false)
const editMode = ref(false)
const editingId = ref(null)
const nameError = ref('')

const colorPresets = ['#667eea','#11998e','#dc3545','#f093fb','#ffc107','#764ba2','#fd7e14','#20c997','#6c757d','#17a2b8','#e83e8c','#28a745','#d63384']

const iconOptions = computed(() => [
  { value: 'bi-folder',            label: t('categories.iconFolder') },
  { value: 'bi-book',              label: t('categories.iconBook') },
  { value: 'bi-heart-pulse',       label: t('categories.iconPsychiatry') },
  { value: 'bi-brain',             label: t('categories.iconBrain') },
  { value: 'bi-emoji-frown',       label: t('categories.iconDepression') },
  { value: 'bi-emoji-angry',       label: t('categories.iconBipolar') },
  { value: 'bi-chat-dots',         label: t('categories.iconAnxiety') },
  { value: 'bi-cup-straw',         label: t('categories.iconAddiction') },
  { value: 'bi-alarm',             label: t('categories.iconSleep') },
  { value: 'bi-hospital',          label: t('categories.iconGeriatric') },
  { value: 'bi-people',            label: t('categories.iconPediatric') },
  { value: 'bi-capsule',           label: t('categories.iconMedication') },
  { value: 'bi-gavel',             label: t('categories.iconForensic') },
  { value: 'bi-exclamation-triangle', label: t('categories.iconEmergency') },
])

const form = reactive({ name: '', description: '', color: '#667eea', icon: 'bi-folder' })

function open(category = null) {
  nameError.value = ''
  if (category) {
    editMode.value = true
    editingId.value = category.id
    form.name = category.name
    form.description = category.description || ''
    form.color = category.color || '#667eea'
    form.icon = category.icon || 'bi-folder'
  } else {
    editMode.value = false
    editingId.value = null
    form.name = ''
    form.description = ''
    form.color = '#667eea'
    form.icon = 'bi-folder'
  }
  isOpen.value = true
}

function close() { isOpen.value = false }

async function handleSubmit() {
  if (!form.name.trim()) {
    nameError.value = t('categories.nameRequired')
    return
  }
  const data = { name: form.name.trim(), description: form.description.trim() || '', color: form.color, icon: form.icon }
  let result
  if (editMode.value) {
    result = await categoryStore.update(editingId.value, data)
  } else {
    result = await categoryStore.create(data)
  }
  if (result) {
    close()
    emit('saved')
  }
}

const emit = defineEmits(['saved'])
defineExpose({ open, close })
</script>
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
          :error="errors.name"
          @blur="touch('name')"
          @input="revalidate('name')"
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
import { useFormValidation } from '@/composables/useFormValidation'

const { t } = useI18n()

const categoryStore = useCategoryStore()

const isOpen = ref(false)
const editMode = ref(false)
const editingId = ref(null)

const DEFAULT_CATEGORY_COLOR = '#6a3f24'
const colorPresets = [
  DEFAULT_CATEGORY_COLOR,
  '#285166',
  '#2f5543',
  '#7d342f',
  '#654711',
  '#51446f',
  '#7f3455',
  '#3d625e',
  '#515b65',
  '#83513a',
  '#66465b',
  '#456044',
]

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

const form = reactive({ name: '', description: '', color: DEFAULT_CATEGORY_COLOR, icon: 'bi-folder' })
const { errors, touch, revalidate, validateAll, resetValidation } = useFormValidation({
  name: () => form.name.trim() ? '' : t('categories.nameRequired'),
})

function open(category = null) {
  resetValidation()
  if (category) {
    editMode.value = true
    editingId.value = category.id
    form.name = category.name
    form.description = category.description || ''
    form.color = category.color || DEFAULT_CATEGORY_COLOR
    form.icon = category.icon || 'bi-folder'
  } else {
    editMode.value = false
    editingId.value = null
    form.name = ''
    form.description = ''
    form.color = DEFAULT_CATEGORY_COLOR
    form.icon = 'bi-folder'
  }
  isOpen.value = true
}

function close() { isOpen.value = false }

async function handleSubmit() {
  if (!validateAll()) return
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

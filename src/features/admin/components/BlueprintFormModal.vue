<!-- frontend/src/features/admin/components/BlueprintFormModal.vue -->
<template>
  <BaseModal
    :is-open="isOpen"
    :title="editMode ? t('admin.blueprints.editTitle') : t('admin.blueprints.createTitle')"
    size="lg"
    @update:is-open="close"
  >
    <FormGrid>
      <BaseInput v-model="form.name" :label="t('admin.blueprints.name')" required />
      <BaseInput v-model="form.description" :label="t('admin.blueprints.description')" />
      <BaseCheckbox v-model="form.is_active" :label="t('admin.blueprints.active')" />
    </FormGrid>

    <h4 class="blueprint-form__weights-title">
      <i class="bi bi-sliders"></i> {{ t('admin.blueprints.weightsTitle') }}
    </h4>
    <p class="text-muted blueprint-form__weights-hint">
      {{ t('admin.blueprints.weightsHint') }}
    </p>

    <div class="weight-editor">
      <div
        v-for="cat in categories"
        :key="cat.id"
        class="weight-editor__row"
      >
        <span class="weight-editor__category">
          <i class="bi bi-folder2" :style="{ color: cat.color }"></i>
          {{ cat.name }}
        </span>
        <BaseInput
          type="number"
          :min="0"
          :step="0.1"
          :model-value="form.weights[cat.id]"
          class="weight-editor__input"
          :aria-label="`${cat.name} ${t('admin.blueprints.weightLabel')}`"
          @update:model-value="form.weights[cat.id] = Number($event)"
        />
        <span class="text-muted weight-editor__label">{{ t('admin.blueprints.weightLabel') }}</span>
      </div>
      <div class="weight-editor__total">
        <span>{{ t('admin.blueprints.totalWeight') }}</span>
        <span class="weight-editor__total-value">{{ totalWeight }}</span>
      </div>
    </div>

    <template #footer>
      <BaseButton variant="secondary" @click="close">{{ t('common.cancel') }}</BaseButton>
      <BaseButton variant="primary" :loading="blueprintStore.isLoading" @click="submit">
        {{ editMode ? t('admin.blueprints.update') : t('admin.blueprints.create') }}
      </BaseButton>
    </template>
  </BaseModal>
</template>

<script setup>
// The weight-editor rules this modal renders — `.weight-editor`,
// `.weight-editor__row`, `.weight-editor__category`,
// `.weight-editor__input`, `.weight-editor__total`,
// `.weight-editor__total-value` — live in blueprints.css. Before
// this import, the modal worked only because `Blueprints.vue`
// (its sole mount point today) happened to import that stylesheet
// for its own `.blueprint-row` rules. Any future mount of this
// modal from a view that does not import blueprints.css would
// render with those rules missing. Importing the stylesheet here
// makes the component self-contained; Vite deduplicates the
// import against the parent's.
import '@/assets/blueprints.css'
import { ref, reactive, computed } from 'vue'
import BaseModal from '@/components/base/BaseModal.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseCheckbox from '@/components/base/BaseCheckbox.vue'
import FormGrid from '@/components/common/FormGrid.vue'
import { useBlueprintStore } from '@/stores/blueprintStore'
import { useCategoryStore } from '@/stores/categoryStore'

const { t } = useI18n()

const emit = defineEmits(['saved'])

const blueprintStore = useBlueprintStore()
const categoryStore = useCategoryStore()

const isOpen = ref(false)
const editMode = ref(false)
const editingId = ref(null)

const form = reactive({
  name: '',
  description: '',
  is_active: true,
  weights: {},
})

const categories = computed(() => categoryStore.items)

const totalWeight = computed(() => {
  return Object.values(form.weights).reduce((sum, v) => sum + (Number(v) || 0), 0)
})

function resetForm() {
  form.name = ''
  form.description = ''
  form.is_active = true
  form.weights = {}
  categories.value.forEach(c => { form.weights[c.id] = 0 })
}

// Public API — mirrors `CategoryForm.vue` / `UserFormModal.vue`.
// `open()` with no argument → create mode; `open(bp)` → edit mode.
function open(bp = null) {
  if (bp) {
    editMode.value = true
    editingId.value = bp.id
    form.name = bp.name
    form.description = bp.description || ''
    form.is_active = bp.is_active
    form.weights = {}
    categories.value.forEach(c => {
      // `bp.weights` arrives from the backend keyed on string ids
      // (see the store comment about preserving the wire shape).
      // Coerce and default to 0 so an unset category renders as 0
      // rather than an empty input.
      form.weights[c.id] = Number(bp.weights[String(c.id)] || 0)
    })
  } else {
    editMode.value = false
    editingId.value = null
    resetForm()
  }
  isOpen.value = true
}

function close() {
  isOpen.value = false
}

async function submit() {
  // Only positive weights are sent. The backend treats missing keys
  // as zero; sending explicit 0s would bloat the payload and would
  // also make the "all weights zero" random-distribution case
  // indistinguishable from an empty weights dict.
  const weightsObj = {}
  for (const [cid, w] of Object.entries(form.weights)) {
    const num = Number(w)
    if (num > 0) weightsObj[String(cid)] = num
  }

  const payload = {
    name: form.name.trim(),
    description: form.description.trim(),
    is_active: form.is_active,
    weights: weightsObj,
  }

  let result
  if (editMode.value) {
    result = await blueprintStore.update(editingId.value, payload)
  } else {
    result = await blueprintStore.create(payload)
  }
  if (result) {
    close()
    emit('saved')
  }
}

defineExpose({ open, close })
</script>

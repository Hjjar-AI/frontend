<!-- frontend/src/features/questions/components/ChoiceEditor.vue -->
<template>
  <div class="choice-editor">
    <div v-for="(choice, index) in choices" :key="index" class="choice-editor__row">
      <span class="choice-editor__number">{{ index + 1 }}</span>
      <BaseInput
        v-model="choices[index]"
        :placeholder="t('questions.choiceN', { n: index + 1 })"
        maxlength="300"
        @update:model-value="emitUpdate"
      />
      <label class="choice-editor__radio">

        <BaseRadio
          v-model="correctAnswer"
          :value="index + 1"
          :label="t('questions.selectCorrect')"
        />
      </label>
      <BaseIconButton
        v-if="choices.length > 2"
        variant="danger"
        size="small"
        icon="bi bi-x"
        :label="t('questions.removeChoice')"
        @click="removeChoice(index)"
      />
    </div>
    <BaseButton
      v-if="choices.length < maxChoices"
      variant="secondary"
      size="small"
      @click="addChoice"
    >
      <i class="bi bi-plus"></i> {{ t('questions.addChoice') }}
    </BaseButton>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useConfigStore } from '@/stores/configStore'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseRadio from '@/components/base/BaseRadio.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseIconButton from '@/components/base/BaseIconButton.vue'
import { FALLBACK_MAX_CHOICES } from '@/utils/constants'


const { t } = useI18n()

const props = defineProps({
  modelValue: { type: Array, default: () => ['', ''] },
  correctAnswer: { type: Number, required: true },
})

const emit = defineEmits(['update:modelValue', 'update:correctAnswer'])

const configStore = useConfigStore()

// Fallback is 8 to match the backend's hard ceiling.
const maxChoices = computed(() => configStore.maxChoices || FALLBACK_MAX_CHOICES)

// ──────────────────────────────────────────────────────────────────
// `choices` keeps the local-ref-plus-watcher pattern.
//
// The choices array is mutated in place (`push`, `splice`, and
// per-element v-model on the input below). A `computed({ get, set })`
// would have to produce a new array on every write, which would
// break `v-model="choices[index]"` — the mutation would target a
// discarded array instance. The local-ref pattern is the correct
// Vue idiom for this case and matches what the Vue 3 docs recommend
// for array props. Leaving it alone.
// ──────────────────────────────────────────────────────────────────
const choices = ref([...props.modelValue])

watch(() => props.modelValue, (val) => {
  choices.value = [...val]
})

const correctAnswer = computed({
  get: () => props.correctAnswer,
  set: (val) => emit('update:correctAnswer', val),
})

function emitUpdate() {
  emit('update:modelValue', choices.value)
}

function addChoice() {
  if (choices.value.length < maxChoices.value) {
    choices.value.push('')
    emitUpdate()
  }
}

function removeChoice(index) {
  choices.value.splice(index, 1)

  // Re-map the correct-answer pointer after a removal. Reading
  // `correctAnswer.value` once into a local and then writing the
  // computed setter twice (in the two branches) is the same flow
  // the previous version had — the local read prevents an
  // intermediate write from being observed on the second branch.
  const current = correctAnswer.value
  if (current === index + 1) {
    // The removed choice WAS the correct one — reset to the first.
    correctAnswer.value = 1
  } else if (current > index + 1) {
    // A choice BEFORE the correct one was removed — shift the pointer.
    correctAnswer.value = current - 1
  }

  emitUpdate()
}
</script>

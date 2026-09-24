<!-- frontend/src/features/questions/components/TagInput.vue -->
<template>
  <BaseField
    id="q-tags"
    class="tag-input"
    :label="t('questions.tagsLabel')"
    :current-length="tagChars"
    :max-length="200"
  >
    <div v-if="recentTags.length" class="tag-input__recent">
      <span class="tag-input__recent-label">{{ t('questions.recentLabel') }}</span>
      <span v-for="tag in recentTags" :key="tag" class="chip" @click="appendTag(tag)">{{
        tag
      }}</span>
    </div>

    <div class="tag-input__wrap">
      <input
        id="q-tags"
        ref="tagInputRef"
        v-model="tags"
        class="form-control"
        :placeholder="t('questions.tagsPlaceholder')"
        maxlength="200"
        autocomplete="off"
        @input="onInput"
        @focus="showSuggestions = true"
        @blur="hideSuggestionsDelayed"
      />
      <Transition name="suggestions">
        <div
          v-if="showSuggestions && matchingTags.length > 0"
          class="tag-input__suggestions"
          @mousedown.prevent
        >
          <button
            v-for="tag in matchingTags"
            :key="tag"
            type="button"
            class="tag-input__suggestion"
            @mousedown.prevent="appendTag(tag)"
          >
            <i class="bi bi-tag"></i> {{ tag }}
          </button>
        </div>
      </Transition>
    </div>
  </BaseField>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRecentItems } from '@/composables/useRecentItems'
import { useDebounceFn } from '@/composables/useDebounceFn'
import { useTagStore } from '@/stores/tagStore'
import BaseField from '@/components/base/BaseField.vue'

const { t } = useI18n()

const props = defineProps({ modelValue: String })
const emit = defineEmits(['update:modelValue'])
const tagStore = useTagStore()

const tags = ref(props.modelValue || '')
const tagInputRef = ref(null)
const showSuggestions = ref(false)
const allTags = computed(() => tagStore.names)

const { recentIds: recentTagIds } = useRecentItems('tags')
const recentTags = computed(() => recentTagIds.value)
const tagChars = ref(tags.value.length)

const currentInput = computed(() => {
  const parts = tags.value.split(',')
  return (parts[parts.length - 1] || '').trim()
})

const matchingTags = computed(() => {
  if (!currentInput.value || currentInput.value.length < 1) return []
  const input = currentInput.value.toLowerCase()
  const existing = tags.value
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
  return allTags.value
    .filter((t) => t.toLowerCase().includes(input) && !existing.includes(t.toLowerCase()))
    .slice(0, 8)
})

function onInput() {
  tagChars.value = tags.value.length
  emit('update:modelValue', tags.value)
  showSuggestions.value = true
}

function appendTag(tag) {
  const parts = tags.value
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
  if (currentInput.value) {
    parts[parts.length - 1] = tag
  } else {
    parts.push(tag)
  }
  tags.value = parts.join(', ')
  tagChars.value = tags.value.length
  emit('update:modelValue', tags.value)
  showSuggestions.value = false
  tagInputRef.value?.focus()
}

const { debounced: hideSuggestionsDelayed } = useDebounceFn(() => {
  showSuggestions.value = false
}, 150)

onMounted(async () => {
  if (tagStore.items.length === 0) await tagStore.fetchList()
})
</script>

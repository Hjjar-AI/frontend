<!-- frontend/src/components/markdown/MarkdownEditor.vue -->
<template>
  <div class="form-group markdown-editor">
    <label :for="id">{{ label }}</label>
    <div v-show="toolbarVisible" class="toolbar-row">
      <MarkdownToolbar @insert="(action) => insertMarkdown(action)" />
      <router-link to="/manual#markdown" class="markdown-help-link" :title="t('markdown.helpLink')">
        <i class="bi bi-question-circle"></i> {{ t('markdown.instructions') }}
      </router-link>
    </div>
    <div class="textarea-wrapper">
      <textarea
        :id="id"
        ref="textareaRef"
        :value="modelValue"
        :rows="rows"
        :maxlength="maxlength"
        @input="onInput"
        @focus="toolbarVisible = true"
        class="form-control"
      ></textarea>
      <span class="char-count" :class="{ 'char-count--warn': charCount > maxlength - 50 }">
        {{ charCount }}/{{ maxlength }}
      </span>
    </div>
    <div class="word-count">
      {{ t('markdown.wordCount', { n: wordCount }) }}
    </div>
    <div class="preview-toggle">
      <button type="button" class="btn-icon btn-icon--compact" @click="showPreview = !showPreview">
        <i :class="showPreview ? 'bi bi-pencil' : 'bi bi-eye'"></i>
        {{ showPreview ? t('markdown.edit') : t('markdown.preview') }}
      </button>
    </div>
    <div v-if="showPreview" class="markdown-preview">
      <BaseMarkdown :text="modelValue" />
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import MarkdownToolbar from '@/components/markdown/MarkdownToolbar.vue'
import BaseMarkdown from '@/components/markdown/BaseMarkdown.vue'


const { t } = useI18n()

const props = defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, required: true },
  id: { type: String, required: true },
  rows: { type: Number, default: 3 },
  maxlength: { type: Number, default: 500 },
})

const emit = defineEmits(['update:modelValue'])

const textareaRef = ref(null)
const toolbarVisible = ref(false)
const showPreview = ref(false)
const charCount = ref((props.modelValue || '').length)

const wordCount = computed(() => {
  const text = props.modelValue || ''
  const words = text.trim().split(/\s+/).filter(Boolean)
  return words.length
})

watch(() => props.modelValue, (val) => {
  charCount.value = (val || '').length
})

function onInput(e) {
  charCount.value = e.target.value.length
  emit('update:modelValue', e.target.value)
}

function insertMarkdown(action) {
  const textarea = textareaRef.value
  if (!textarea) return

  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const text = textarea.value
  const selected = text.substring(start, end)

  let inserted = ''
  switch (action) {
    case 'bold': inserted = `**${selected}**`; break
    case 'italic': inserted = `*${selected}*`; break
    case 'underline': inserted = `<u>${selected}</u>`; break
    case 'strikethrough': inserted = `~~${selected}~~`; break
    case 'superscript': inserted = `^(${selected})^`; break
    case 'subscript': inserted = `~(${selected})~`; break
    case 'highlight': inserted = `==${selected}==`; break
    case 'code': inserted = `\`${selected}\``; break
    case 'link': inserted = `[${selected || 'text'}](url)`; break
    case 'image': inserted = `![${t('markdown.imageAltExample')}](https://example.com/image.png)`; break
    case 'table': inserted = `
| ${t('markdown.tableColumn1')} | ${t('markdown.tableColumn2')} |
|----------|----------|
| ${t('markdown.tableCell')} | ${t('markdown.tableCell2')} |
`; break
    case 'ul': inserted = `
- ${t('markdown.listItem')}
- ${t('markdown.listItem2')}
`; break
    case 'ol': inserted = `
1. ${t('markdown.orderedItem1')}
2. ${t('markdown.orderedItem2')}
`; break
    default: return
  }

  const newText = text.substring(0, start) + inserted + text.substring(end)
  textarea.value = newText
  emit('update:modelValue', newText)
  charCount.value = newText.length

  const newPos = start + inserted.length
  textarea.selectionStart = newPos
  textarea.selectionEnd = newPos
  textarea.focus()
}
</script>
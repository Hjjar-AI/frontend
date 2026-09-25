<!-- frontend/src/components/common/ScrollToTop.vue -->
<template>
  <BaseIconButton
    v-show="visible"
    class="scroll-to-top"
    icon="bi bi-arrow-up"
    :label="t('ui.goToTop')"
    @click="scrollToTop"
  />
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import BaseIconButton from '@/components/base/BaseIconButton.vue'

const { t } = useI18n()

const visible = ref(false)

function onScroll() {
  visible.value = window.scrollY > 300
}

function scrollToTop() {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const narrowViewport = window.matchMedia('(max-width: 768px)').matches
  requestAnimationFrame(() => {
    window.scrollTo({ top: 0, left: 0, behavior: reducedMotion || narrowViewport ? 'auto' : 'smooth' })
  })
}

onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
})
onUnmounted(() => window.removeEventListener('scroll', onScroll))
</script>

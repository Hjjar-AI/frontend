<!-- frontend/src/components/common/ScrollToTop.vue -->
<template>
  <button
    v-show="visible"
    class="scroll-to-top"
    @click="scrollToTop"
    :aria-label="t('ui.goToTop')"
  >
    <i class="bi bi-arrow-up"></i>
  </button>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const { t } = useI18n()

const visible = ref(false)

function onScroll() {
  visible.value = window.scrollY > 300
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
onUnmounted(() => window.removeEventListener('scroll', onScroll))
</script>
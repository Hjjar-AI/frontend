<!-- frontend/src/components/common/Layout.vue -->
<template>
  <div class="layout">
    <div class="navbar-progress" :class="{ 'navbar-progress--loading': isNavigating }">
      <div class="navbar-progress__bar"></div>
    </div>
    <ExpiryWarning />
    <Navbar />
    <main id="main-content" class="layout__main"><slot /></main>
    <Footer />
    <MobileBottomNav />
  </div>
</template>

<script setup>
import ExpiryWarning from '@/components/layout/ExpiryWarning.vue'
import Navbar from '@/components/layout/Navbar.vue'
import Footer from '@/components/layout/Footer.vue'
import MobileBottomNav from '@/components/layout/MobileBottomNav.vue'

defineProps({
  isNavigating: { type: Boolean, default: false },
})
</script>


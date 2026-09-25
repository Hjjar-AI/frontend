<!-- Four persistent destinations only. All secondary destinations live in
     the navbar menu, avoiding a second mobile information architecture. -->
<template>
  <nav class="bottom-nav no-print" :aria-label="t('a11y.bottomNav')">
    <div class="bottom-nav__bar">
      <router-link
        v-for="link in bottomLinks"
        :key="link.id"
        :to="link.to"
        class="bottom-nav__item"
        :class="{ 'bottom-nav__item--active': isLinkActive(link) }"
      >
        <span class="bottom-nav__icon"><i :class="link.icon"></i></span>
        <span class="bottom-nav__label">{{ t(link.shortLabelKey || link.labelKey) }}</span>
      </router-link>
    </div>
  </nav>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { navigationLinksFor, isNavigationLinkActive } from '@/constants/navigationLinks'

const { t } = useI18n()
const route = useRoute()
const authStore = useAuthStore()

const canUseLink = link => !link.capability || authStore.can(link.capability)
const bottomLinks = computed(() => navigationLinksFor('bottomNav').filter(canUseLink))
const isLinkActive = link => isNavigationLinkActive(link, route.path)
</script>

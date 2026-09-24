<!-- frontend/src/components/layout/LanguageSwitcher.vue -->
<template>
  <div ref="rootRef" class="language-dropdown">
    <BaseButton
      variant="ghost"
      size="small"
      raw-content
      class="language-dropdown__toggle"
      :aria-label="t('language.switch')"
      :title="t('language.switch')"
      :aria-expanded="isOpen"
      aria-haspopup="true"
      @click.stop="toggle"
    >
      <i class="bi bi-translate"></i>
      <span class="language-dropdown__code">{{ currentCode }}</span>
      <i
        class="bi bi-chevron-down language-dropdown__arrow"
        :class="{ 'language-dropdown__arrow--open': isOpen }"
      ></i>
    </BaseButton>

    <BasePopoverPanel :open="isOpen" panel-class="language-dropdown__menu">
        <BaseButton
          v-for="locale in SUPPORTED_LOCALES"
          :key="locale"
          variant="ghost"
          size="small"
          raw-content
          class="language-dropdown__item"
          :class="{ 'language-dropdown__item--active': locale === currentLocale }"
          @click="select(locale)"
        >
          <span class="language-dropdown__flag" aria-hidden="true">
            {{ locale === 'ar' ? 'ع' : 'EN' }}
          </span>
          <span class="language-dropdown__label">{{ LOCALE_META[locale].label }}</span>
          <i
            v-if="locale === currentLocale"
            class="bi bi-check2 language-dropdown__check"
          ></i>
        </BaseButton>
    </BasePopoverPanel>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { setLocale } from '@/i18n'
import { LOCALE_META, SUPPORTED_LOCALES } from '@/i18n/helpers/direction'
import { useNotify } from '@/composables/useNotify'
import { useDropdown } from '@/composables/useDropdown'
import BasePopoverPanel from '@/components/base/BasePopoverPanel.vue'
import BaseButton from '@/components/base/BaseButton.vue'

const { t, locale } = useI18n()
const { notify } = useNotify()

// All of open/close/toggle/click-outside/Escape/focus-return now
// live in useDropdown(). The composable owns its own `isOpen` ref
// and binds `rootRef` in the template to the same ref it uses for
// outside-click detection.
const { isOpen, rootRef, close, toggle } = useDropdown()

const currentLocale = computed(() => locale.value)
const currentCode = computed(() => currentLocale.value.toUpperCase())

function announceLanguage(localeKey) {
  const announcer = document.getElementById('a11y-announcer')
  if (announcer) {
    announcer.textContent = t('a11y.languageChanged', {
      language: LOCALE_META[localeKey].label,
    })
  }
}

function select(next) {
  if (next === currentLocale.value) {
    close()
    return
  }

  // setLocale flips i18n AND <html lang dir data-locale>, and writes
  // `localStorage['locale']`. It is the single writer for that key —
  // `preferencesStore.load()` reads the same key on boot, so no
  // separate write from the store is needed.
  const applied = setLocale(next)

  // Announce for screen readers, then notify. Both use the NEW locale
  // because setLocale() already switched it — this is intentional;
  // the user just chose the new language, and a confirmation in the
  // old one would be jarring.
  announceLanguage(applied)
  notify(t('language.changed', { language: LOCALE_META[applied].label }), 'info')

  close()
}
</script>

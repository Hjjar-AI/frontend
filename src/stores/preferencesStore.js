// frontend/src/stores/preferencesStore.js
import { defineStore } from 'pinia'
import { storageService } from '@/services/storageService'
import { standardState, standardGetters } from '@/stores/storeHelpers'
import { SUPPORTED_LOCALES, DEFAULT_LOCALE } from '@/i18n/helpers/direction'
import { i18n } from '@/i18n'

const VALID_PER_PAGE = [10, 20, 50, 100]
const VALID_DIFFICULTY = ['', 'easy', 'medium', 'hard']
const VALID_DENSITY = ['comfortable', 'compact']

const KEY = {
  perPage: 'pref_perPage',
  difficulty: 'pref_difficulty',
  autoAdvance: 'pref_autoAdvance',
  sound: 'pref_sound',
  density: 'pref_density',
  // NOTE: the locale is stored under the same key that i18n/index.js
  // reads. There is exactly one writer (setLocale in i18n/index.js)
  // and preferencesStore does not touch it.
  locale: 'locale',
}

export const usePreferencesStore = defineStore('preferences', {
  state: () => standardState({
    defaultPerPage: 20,
    defaultDifficulty: '',
    autoAdvance: false,
    soundEffects: true,
    density: 'comfortable',
    locale: DEFAULT_LOCALE,
  }),

  getters: {
    ...standardGetters,
  },

  actions: {
    load() {
      const rawPerPage = Number(storageService.getItem(KEY.perPage))
      this.defaultPerPage = VALID_PER_PAGE.includes(rawPerPage) ? rawPerPage : 20

      const rawDifficulty = storageService.getItem(KEY.difficulty)
      this.defaultDifficulty = VALID_DIFFICULTY.includes(rawDifficulty) ? rawDifficulty : ''

      this.autoAdvance = storageService.getItem(KEY.autoAdvance) === 'true'
      this.soundEffects = storageService.getItem(KEY.sound) !== 'false'
      const rawDensity = storageService.getItem(KEY.density)
      this.density = VALID_DENSITY.includes(rawDensity) ? rawDensity : 'comfortable'
      document.documentElement.setAttribute('data-density', this.density)

      // Read the ACTIVE locale from the i18n singleton rather than
      // re-parsing localStorage['locale']. Both used to read the
      // same key with independent fallbacks; they agreed only
      // because both defaulted to 'ar'. Diverging defaults in one
      // place would have made the store report a different locale
      // than the UI actually rendered. i18n.global.locale is the
      // single source of truth — it has already been initialised
      // by the time this runs (see main.js import order).
      const activeLocale = i18n.global.locale.value
      this.locale = SUPPORTED_LOCALES.includes(activeLocale) ? activeLocale : DEFAULT_LOCALE
    },

    update(key, value) {
      switch (key) {
        case 'defaultPerPage': {
          const n = Number(value)
          value = VALID_PER_PAGE.includes(n) ? n : 20
          break
        }
        case 'defaultDifficulty': {
          value = VALID_DIFFICULTY.includes(value) ? value : ''
          break
        }
        case 'autoAdvance':
        case 'soundEffects': {
          value = Boolean(value)
          break
        }
        case 'density': {
          value = VALID_DENSITY.includes(value) ? value : 'comfortable'
          document.documentElement.setAttribute('data-density', value)
          break
        }
        case 'locale': {
          // The store does NOT write the locale key. It is
          // owned by i18n/index.js's setLocale() helper, which
          // also flips <html lang dir data-locale>. Writing here
          // as well would give two writers for one key.
          value = SUPPORTED_LOCALES.includes(value) ? value : DEFAULT_LOCALE
          break
        }
      }

      this[key] = value

      const storageKey = {
        defaultPerPage: KEY.perPage,
        defaultDifficulty: KEY.difficulty,
        autoAdvance: KEY.autoAdvance,
        soundEffects: KEY.sound,
        density: KEY.density,
      }[key]

      if (storageKey) {
        storageService.setItem(storageKey, String(value))
      }
    },

    reset() {
      this.defaultPerPage = 20
      this.defaultDifficulty = ''
      this.autoAdvance = false
      this.soundEffects = true
      this.density = 'comfortable'
      this.locale = DEFAULT_LOCALE
      document.documentElement.setAttribute('data-density', this.density)

      storageService.removeItem(KEY.perPage)
      storageService.removeItem(KEY.difficulty)
      storageService.removeItem(KEY.autoAdvance)
      storageService.removeItem(KEY.sound)
      storageService.removeItem(KEY.density)
      // Intentionally NOT clearing the locale key: language is a UI
      // preference that should survive logout. It is not reset here
      // because this store is not the owner of that key.
    },
  },
})

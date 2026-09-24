<!-- frontend/src/features/about/views/About.vue -->

<template>
  <Layout>
    <div class="about-page">
      <!-- Hero Section -->
      <BaseCard class="about-hero">
        <div class="hero-content">
          <div class="hero-icon">
            <i class="bi bi-journal-medical"></i>
          </div>
          <div class="hero-text">
            <h1>{{ t('app.name') }}</h1>
            <p class="hero-tagline">{{ t('app.tagline') }}</p>
            <div class="hero-badges">
              <BaseBadge variant="info">
                <i class="bi bi-tag"></i> {{ t('app.version', { version: APP_VERSION }) }}
              </BaseBadge>
              <BaseBadge variant="success">
                <i class="bi bi-shield-check"></i> {{ t('about.hero.badgeVerified') }}
              </BaseBadge>
              <BaseBadge variant="warning">
                <i class="bi bi-hospital"></i> {{ t('about.hero.badgeHospital') }}
              </BaseBadge>
            </div>
          </div>
        </div>
      </BaseCard>

      <!-- Vision & Mission -->
      <div class="section-grid">
        <BaseCard variant="primary" class="section-card">
          <h3 class="card-title">
            <i class="card-title__icon bi bi-eye"></i> {{ t('about.vision.title') }}
          </h3>
          <p class="section-text">{{ t('about.vision.body') }}</p>
        </BaseCard>
        <BaseCard variant="info" class="section-card">
          <h3 class="card-title">
            <i class="card-title__icon bi bi-bullseye"></i> {{ t('about.mission.title') }}
          </h3>
          <p class="section-text">{{ t('about.mission.body') }}</p>
        </BaseCard>
      </div>

      <!-- Features Overview -->
      <BaseCard class="features-card">
        <h2 class="card-title">
          <i class="card-title__icon bi bi-stars"></i> {{ t('about.features.title') }}
        </h2>
        <div class="features-grid">
          <div class="feature-item" v-for="feature in features" :key="feature.key">
            <div class="feature-icon" :style="{ background: feature.color }">
              <i :class="feature.icon"></i>
            </div>
            <div class="feature-content">
              <h4>{{ t(`about.features.${feature.key}.title`) }}</h4>
              <p>{{ t(`about.features.${feature.key}.description`) }}</p>
            </div>
          </div>
        </div>
      </BaseCard>

      <!-- Development Team -->
      <BaseCard class="team-card">
        <h2 class="card-title">
          <i class="card-title__icon bi bi-people-fill"></i> {{ t('about.team.title') }}
        </h2>
        <div class="team-grid">
          <div
            v-for="member in teamMembers"
            :key="member.key"
            class="team-member"
            :class="{ 'team-member--lead': member.isLead }"
          >
            <div class="member-avatar" :class="{ 'member-avatar--lead': member.isLead }">
              <i :class="member.avatarIcon"></i>
            </div>
            <div class="member-info">
              <span class="member-role">{{ t(`about.team.${member.key}.role`) }}</span>
              <h4>{{ t(`about.team.${member.key}.name`) }}</h4>
              <p class="member-title">{{ t(`about.team.${member.key}.title`) }}</p>
              <p class="member-bio">{{ t(`about.team.${member.key}.bio`) }}</p>
            </div>
          </div>
        </div>
      </BaseCard>

      <!-- AI & Technical Support -->
      <BaseCard class="support-card">
        <h2 class="card-title">
          <i class="card-title__icon bi bi-robot"></i> {{ t('about.ai.title') }}
        </h2>
        <p class="section-text">{{ t('about.ai.intro') }}</p>
        <div class="ai-chips">
          <BaseBadge variant="info" v-for="ai in aiTools" :key="ai">
            <i class="bi bi-cpu"></i> {{ ai }}
          </BaseBadge>
        </div>
      </BaseCard>

      <!-- Testing Team -->
      <BaseCard variant="success" class="testers-card">
        <h2 class="card-title">
          <i class="card-title__icon bi bi-clipboard-check"></i>
          {{ t('about.testers.title') }}
        </h2>
        <p class="section-text">{{ t('about.testers.intro') }}</p>

        <!-- القسم الفرعي 1: اختبار أولي وتدقيق محتوى -->
        <section class="testers-group">
          <h3 class="testers-group__title">
            <span class="testers-group__num">1</span>
            {{ t('about.testers.groups.initial') }}
          </h3>
          <div class="testers-list">
            <div
              class="tester-item"
              v-for="tester in testerGroups.initial"
              :key="tester"
            >
              <div class="tester-avatar">
                <i class="bi bi-person-check"></i>
              </div>
              <span class="tester-name">{{ tester }}</span>
            </div>
          </div>
        </section>

        <hr class="testers-divider" />

        <!-- القسم الفرعي 2: اختبار -->
        <section class="testers-group">
          <h3 class="testers-group__title">
            <span class="testers-group__num">2</span>
            {{ t('about.testers.groups.testing') }}
          </h3>
          <div class="testers-list">
            <div
              class="tester-item"
              v-for="tester in testerGroups.testing"
              :key="tester"
            >
              <div class="tester-avatar">
                <i class="bi bi-person-check"></i>
              </div>
              <span class="tester-name">{{ tester }}</span>
            </div>
          </div>
        </section>

        <hr class="testers-divider" />

        <!-- القسم الفرعي 3: تدقيق -->
        <section class="testers-group">
          <h3 class="testers-group__title">
            <span class="testers-group__num">3</span>
            {{ t('about.testers.groups.verification') }}
          </h3>
          <div class="testers-list">
            <div
              class="tester-item"
              v-for="tester in testerGroups.verification"
              :key="tester"
            >
              <div class="tester-avatar">
                <i class="bi bi-person-check"></i>
              </div>
              <span class="tester-name">{{ tester }}</span>
            </div>
          </div>
        </section>
      </BaseCard>

      <!-- Technical Stack (upgraded) -->
      <BaseCard class="tech-card">
        <h2 class="card-title">
          <i class="card-title__icon bi bi-stack"></i> {{ t('about.tech.title') }}
        </h2>
        <p class="tech-card__intro">{{ t('about.tech.intro') }}</p>

        <div class="tech-sections">
          <section
            v-for="group in techGroups"
            :key="group.key"
            class="tech-section"
          >
            <header class="tech-section__header">
              <div class="tech-section__icon" :class="`tech-section__icon--${group.key}`">
                <i :class="group.icon"></i>
              </div>
              <div class="tech-section__heading">
                <h3 class="tech-section__title">{{ t(`about.tech.${group.key}.title`) }}</h3>
                <p class="tech-section__intro">{{ t(`about.tech.${group.key}.intro`) }}</p>
              </div>
            </header>

            <ul class="tech-list">
              <li
                v-for="item in TECH_STACK[group.key]"
                :key="item.name"
                class="tech-item"
              >
                <span class="tech-item__icon">
                  <i :class="item.icon"></i>
                </span>
                <div class="tech-item__body">
                  <div class="tech-item__name-row">
                    <span class="tech-item__name">{{ item.name }}</span>
                    <span v-if="item.version" class="tech-item__version">{{ item.version }}</span>
                  </div>
                  <p class="tech-item__desc">{{ t(`about.tech.items.${item.descKey}`) }}</p>
                </div>
              </li>
            </ul>
          </section>
        </div>
      </BaseCard>

      <!-- Statistics -->
      <BaseCard class="stats-card">
        <h2 class="card-title">
          <i class="card-title__icon bi bi-graph-up"></i> {{ t('about.stats.title') }}
        </h2>
        <div class="stats-grid">
          <div class="stat-item" v-for="stat in statItems" :key="stat.key">
            <div class="stat-icon">
              <i :class="stat.icon"></i>
            </div>
            <div class="stat-value">{{ t(`about.stats.${stat.key}.value`) }}</div>
            <div class="stat-label">{{ t(`about.stats.${stat.key}.label`) }}</div>
          </div>
        </div>
      </BaseCard>

      <!-- Accessibility -->
      <BaseCard class="accessibility-card">
        <h2 class="card-title">
          <i class="card-title__icon bi bi-universal-access"></i> {{ t('about.a11y.title') }}
        </h2>
        <p class="section-text">{{ t('about.a11y.intro') }}</p>
        <div class="accessibility-features">
          <div
            class="a11y-item"
            v-for="item in a11yItems"
            :key="item.key"
          >
            <i :class="item.icon"></i>
            <div>
              <strong>{{ t(`about.a11y.${item.key}.title`) }}</strong>
              <p>{{ t(`about.a11y.${item.key}.description`) }}</p>
            </div>
          </div>
        </div>
      </BaseCard>

      <!-- Contact -->
      <BaseCard class="contact-card">
        <h2 class="card-title">
          <i class="card-title__icon bi bi-envelope-paper"></i> {{ t('about.contact.title') }}
        </h2>
        <p class="section-text">{{ t('about.contact.intro') }}</p>
        <div class="contact-info">
          <div
            class="contact-item"
            v-for="item in contactItems"
            :key="item.key"
          >
            <i :class="item.icon"></i>
            <div>
              <strong>{{ t(`about.contact.${item.key}.label`) }}</strong>
              <span>{{ t(`about.contact.${item.key}.value`) }}</span>
            </div>
          </div>
        </div>
      </BaseCard>

      <!-- Disclaimer -->
      <BaseCard variant="warning" class="disclaimer-card">
        <div class="disclaimer-content">
          <i class="bi bi-exclamation-triangle-fill"></i>
          <div>
            <h4>{{ t('about.disclaimer.title') }}</h4>
            <p>{{ t('about.disclaimer.para1') }}</p>
            <p>{{ t('about.disclaimer.para2') }}</p>
            <p>
              {{ t('about.disclaimer.para3Before') }}
              <router-link to="/privacy">{{ t('about.disclaimer.privacyLink') }}</router-link>.
            </p>
          </div>
        </div>
      </BaseCard>

      <!-- Footer Credit -->
      <div class="about-footer">
        <p>
          <i class="bi bi-heart-fill"></i>
          {{ t('about.footer.madeWith') }}
        </p>
        <p class="copyright">
          {{ t('about.footer.copyright', { year: currentYear }) }}
        </p>
      </div>
    </div>
  </Layout>
</template>

<script setup>
import '@/assets/about.css'
import { computed } from 'vue'
import Layout from '@/components/common/Layout.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseBadge from '@/components/base/BaseBadge.vue'
import { APP_VERSION } from '@/utils/constants'
import { useSafeI18n } from '@/composables/useSafeI18n'

// ── Safe i18n ─────────────────────────────────────────────────────
//
// The `useSafeI18n` composable replaces the inline try/catch wrapper
// this component used to define. It is the same guard against
// vue-i18n's bare `SyntaxError` on unescaped `@` / `|` / `{` / `}` —
// on a thrown compile error it logs the key and returns it, so a
// single bad catalog entry degrades to a visible placeholder instead
// of blanking the page via ErrorBoundary. See the composable's header
// for the full rationale. The `locale` ref is also returned so the
// tester-name list can pick a per-locale array.
const { t, locale } = useSafeI18n('About')

const currentYear = computed(() => new Date().getFullYear())

// ── Hardcoded display lists ───────────────────────────────────────
const AI_TOOLS = ['DeepSeek', 'Claude', 'Qwen Studio', 'Gemini', 'ChatGPT']

const TESTER_NAMES_BY_LOCALE = {
  ar: {
    initial: [
      'د. آية كسيبي',
      'د. هدية الله ملص',
    ],
    testing: [
      'د. ظلال الواو',
      'د. أيهم شيخة',
      'د. إبراهيم طرشه',
      'د. شفان شمسي',
      'د. محمد نضال عبد الوهاب',
      'د. محمد نور السيد',
    ],
    verification: [
      'د. نور الهندي',
    ],
  },
  en: {
    initial: [
      'Dr. Aya Kseibi',
      'Dr. Hadiyatullah Malas',
    ],
    testing: [
      'Dr. Zilal Al-Waw',
      'Dr. Ayham Shaykha',
      'Dr. Ibrahim Tarsha',
      'Dr. Shvan Shamsi',
      'Dr. Muhammad Nidal Abdul-Wahhab',
      'Dr. Muhammad Nour Al-Sayed',
    ],
    verification: [
      'Dr. Nour Al-Hindi',
    ],
  },
}

// ── Technical stack data ───────────────────────────────────────────
//
// Tool names, versions, and icons are proper nouns / numbers / icon
// classes, so they stay here as plain constants. Only the role
// descriptions live in the catalog (per-locale prose). Each item's
// `descKey` maps into `about.tech.items.<descKey>`.
//
// Versions reflect what the project actually pins in package.json /
// requirements.txt. Update both when you bump a dependency.
const TECH_STACK = {
  frontend: [
    { name: 'Vue',            version: '3.5',  icon: 'bi bi-code-slash',        descKey: 'vue' },
    { name: 'Pinia',          version: '4.0',  icon: 'bi bi-boxes',             descKey: 'pinia' },
    { name: 'Vue Router',     version: '5.3',  icon: 'bi bi-signpost-split',    descKey: 'router' },
    { name: 'Vite',           version: '8.3',  icon: 'bi bi-lightning-charge',  descKey: 'vite' },
    { name: 'Chart.js',       version: '4.5',  icon: 'bi bi-bar-chart',         descKey: 'chartjs' },
    { name: 'Markdown-it',    version: '15',   icon: 'bi bi-markdown',          descKey: 'markdown' },
    { name: 'Bootstrap Icons',version: '1.11', icon: 'bi bi-palette',           descKey: 'icons' },
  ],
  backend: [
    { name: 'Django',                    version: '5.0',  icon: 'bi bi-server',  descKey: 'django' },
    { name: 'Django REST Framework',     version: '3.15', icon: 'bi bi-plug',    descKey: 'drf' },
    { name: 'django-filter',             version: '',     icon: 'bi bi-funnel',  descKey: 'filter' },
    { name: 'Jazzmin',                   version: '',     icon: 'bi bi-brush',   descKey: 'jazzmin' },
    { name: 'python-dotenv',             version: '',     icon: 'bi bi-key',     descKey: 'dotenv' },
    { name: 'pandas + openpyxl',         version: '',     icon: 'bi bi-table',   descKey: 'pandas' },
  ],
  database: [
    { name: 'SQLite',      version: '',  icon: 'bi bi-database',   descKey: 'sqlite' },
    { name: 'WAL Mode',    version: '',  icon: 'bi bi-layers',     descKey: 'wal' },
    { name: 'Django ORM',  version: '',  icon: 'bi bi-diagram-3',  descKey: 'orm' },
    { name: 'JSON Fields', version: '',  icon: 'bi bi-braces',     descKey: 'json' },
    { name: 'File Storage',version: '',  icon: 'bi bi-folder',     descKey: 'files' },
  ],
  security: [
    { name: 'PBKDF2-SHA256',   version: '',  icon: 'bi bi-shield-lock',    descKey: 'pbkdf2' },
    { name: 'CSRF Protection', version: '',  icon: 'bi bi-shield-check',   descKey: 'csrf' },
    { name: 'Session Auth',    version: '',  icon: 'bi bi-person-badge',   descKey: 'session' },
    { name: 'Rate Limiting',   version: '',  icon: 'bi bi-speedometer',    descKey: 'throttle' },
    { name: 'HttpOnly Cookies',version: '',  icon: 'bi bi-cookie',         descKey: 'cookies' },
  ],
}

const aiTools = computed(() => AI_TOOLS)

const testerGroups = computed(() => {
  return TESTER_NAMES_BY_LOCALE[locale.value] || TESTER_NAMES_BY_LOCALE.ar
})

// ── Static display data ────────────────────────────────────────────
const features = [
  { key: 'questionManagement', icon: 'bi bi-question-circle-fill', color: 'color-mix(in srgb, var(--color-primary) 15%, transparent)' },
  { key: 'twoModes',           icon: 'bi bi-journal-check',         color: 'color-mix(in srgb, var(--color-success) 15%, transparent)' },
  { key: 'markdownSupport',    icon: 'bi bi-markdown',              color: 'color-mix(in srgb, var(--color-info) 15%, transparent)' },
  { key: 'membership',         icon: 'bi bi-people-fill',           color: 'color-mix(in srgb, var(--color-warning) 15%, transparent)' },
  { key: 'verification',       icon: 'bi bi-patch-check-fill',      color: 'color-mix(in srgb, var(--color-success) 15%, transparent)' },
  { key: 'tagging',            icon: 'bi bi-tags-fill',             color: 'color-mix(in srgb, var(--color-primary) 15%, transparent)' },
  { key: 'backup',             icon: 'bi bi-database-fill',         color: 'color-mix(in srgb, var(--color-info) 15%, transparent)' },
  { key: 'arabicUI',           icon: 'bi bi-translate',             color: 'color-mix(in srgb, var(--color-warning) 15%, transparent)' },
]

const teamMembers = [
  { key: 'lead',        isLead: true,  avatarIcon: 'bi bi-person-badge' },
  { key: 'inspiration', isLead: false, avatarIcon: 'bi bi-cpu' },
  { key: 'supporter',   isLead: false, avatarIcon: 'bi bi-building' },
]

// Group metadata: display order, header icon, and the "tint" applied
// to the group header icon. Kept separate from TECH_STACK so the two
// concerns (which groups to show vs. what's in each group) can be
// edited independently.
const techGroups = [
  { key: 'frontend', icon: 'bi bi-window' },
  { key: 'backend',  icon: 'bi bi-server' },
  { key: 'database', icon: 'bi bi-database' },
  { key: 'security', icon: 'bi bi-shield-lock' },
]

const statItems = [
  { key: 'categories', icon: 'bi bi-layers' },
  { key: 'questions',  icon: 'bi bi-question-circle' },
  { key: 'themes',     icon: 'bi bi-palette' },
  { key: 'files',      icon: 'bi bi-code-slash' },
]

const a11yItems = [
  { key: 'keyboard',      icon: 'bi bi-keyboard' },
  { key: 'screenReaders', icon: 'bi bi-eye' },
  { key: 'contrast',      icon: 'bi bi-palette2' },
  { key: 'touchTargets',  icon: 'bi bi-phone' },
]

const contactItems = [
  { key: 'entity',   icon: 'bi bi-building' },
  { key: 'email',    icon: 'bi bi-envelope' },
  { key: 'location', icon: 'bi bi-geo-alt' },
  { key: 'support',  icon: 'bi bi-clock' },
]
</script>

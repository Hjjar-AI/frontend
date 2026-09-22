// frontend/eslint.config.js
import pluginVue from 'eslint-plugin-vue'
import unusedImports from 'eslint-plugin-unused-imports'
import eslintConfigPrettier from 'eslint-config-prettier'

export default [
  // Base JavaScript configuration
  {
    files: ['**/*.js', '**/*.vue'],
    rules: {
      'no-unused-vars': 'off',
    },
  },

  // Vue3 recommended rules
  ...pluginVue.configs['flat/recommended'],

  {
    plugins: {
      'unused-imports': unusedImports,
    },
    rules: {
      // ── Vue specific ─────────────────────────────────────────────
      'vue/multi-word-component-names': 'error',
      'vue/component-name-in-template-casing': ['error', 'PascalCase'],
      'vue/attribute-hyphenation': ['error', 'always'],
      'vue/html-self-closing': 'off',
      'vue/max-attributes-per-line': 'off',
      'vue/singleline-html-element-content-newline': 'off',

      // ── i18n migration aid ───────────────────────────────────────
      //
      // Flags any unquoted text node inside a template — the exact
      // pattern of a hardcoded, untranslated string.
      //
      //
      // The allowlist below exempts the shapes that appear in almost
      // every template and are NOT translation targets:
      //
      //   • punctuation-only or whitespace-only content
      //   • single characters (`.`, `/`, `:`, `•`, `—`, digits)
      //   • the two brand names (translated elsewhere when needed)
      //   • arrow / chevron glyphs used as icons
      //
      // Anything else — an Arabic word, an English phrase, a plural
      // like "5 items" — triggers the rule. Fix by replacing the
      // literal with a `{{ t('namespace.key') }}` expression.
      'vue/no-bare-strings-in-template': ['warn', {
        allowlist: [
          // Whitespace + punctuation only (covers `.`, `/`, `-`, `:`,
          // `•`, `·`, `—`, `→`, `←`, and their combinations).
          '^[\\s\\p{P}\\p{S}]+$',
          // Single character (letter, digit, or symbol).
          '^.$',
          // Brand names. `مُختبِر` carries a diacritic — match both
          // the diacritized and the plain form.
          '^مُختبِر$',
          '^مختبِر$',
          '^Mukhtabir$',
          // Keyboard shortcut hints that are pure symbols.
          '^[0-9]+$',
          '^[0-9]+\\s*[-–]\\s*[0-9]+$',
          // Common Arabic non-translatable fragments.
          '^#\\s*$',
          '^%$',
        ],
        attributes: {
          // By default the rule also checks attribute VALUES for
          // bare strings. We only want it to flag the ones that are
          // definitely user-visible. The defaults already cover
          // `title`, `aria-label`, `aria-placeholder`, `alt`,
          // `placeholder`, and a few others — leave them on.
          //
          // `/^aria-/` is the important one: every `aria-label`
          // should be a translation call.
          '/^aria-/$/': ['aria-label', 'aria-placeholder', 'aria-roledescription', 'aria-valuetext'],
          // Nothing else is added here — the rule's built-in defaults
          // already include `title`, `alt`, `placeholder`, `label`,
          // `aria-label`, `aria-placeholder`, etc.
        },
      }],

      // ── Unused imports ───────────────────────────────────────────
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        { vars: 'all', varsIgnorePattern: '^_', args: 'after-used', argsIgnorePattern: '^_' },
      ],

      // ── General ──────────────────────────────────────────────────
      'no-console': 'warn',
      'no-debugger': 'error',
    },
  },

  // Route views and a few application-shell components intentionally
  // use concise, single-word names. They are never registered as native
  // custom elements, so the multi-word collision rule adds no value.
  {
    files: [
      'src/features/**/views/*.vue',
      'src/components/common/Layout.vue',
      'src/components/common/Timer.vue',
      'src/components/layout/Footer.vue',
      'src/components/layout/Navbar.vue',
    ],
    rules: {
      'vue/multi-word-component-names': 'off',
    },
  },

  // This ensures Prettier's structural rules take precedence over Vue template formatting
  eslintConfigPrettier
]

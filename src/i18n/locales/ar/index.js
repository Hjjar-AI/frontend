// frontend/src/i18n/locales/ar/index.js
//
// Aggregates the per-feature Arabic namespaces into one messages
// object. Each JSON file contributes one or more top-level keys,
// which is why they can be flattened with a plain spread — no file
// defines the same top-level key twice (see the key-ownership table
// in the i18n README or the migration plan).

import common from './common.json'
import auth from './auth.json'
import dashboard from './dashboard.json'
import questions from './questions.json'
import tests from './tests.json'
import masterExams from './masterExams.json'
import admin from './admin.json'
import profile from './profile.json'
import content from './content.json'
import analytics from './analytics.json'
import categories from './categories.json'
import about from './about.json'
import knowledge from './knowledge.json'

export default {
  ...common,
  ...auth,
  ...dashboard,
  ...questions,
  ...tests,
  ...masterExams,
  ...admin,
  ...profile,
  ...content,
  ...analytics,
  ...categories,
  ...about,
  ...knowledge,
}

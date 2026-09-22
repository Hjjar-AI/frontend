// frontend/src/services/api/endpoints.js
//
// API base URL resolution.
//
// `VITE_API_BASE_URL` may be supplied with or without a trailing
// slash depending on the deployment (a reverse-proxy subpath often
// ends with one; the built-in default never does). Callers below
// concatenate paths that already begin with `/`, so a raw trailing
// slash would produce `//` in every assembled URL.
//
// Stripping once, here, is the single source of truth for that
// normalisation. Every consumer — `api/client.js` (`baseURL:
// API_BASE + '/'`), `adminService`'s export URL builders, and
// `masterExamService.summaryCsvUrl` / `matrixCsvUrl` — reads the same
// already-normalised value. Vue files consume those URLs through stores.
const RAW_API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1'

export const API_BASE = RAW_API_BASE.replace(/\/+$/, '')

export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login/',
    LOGOUT: '/auth/logout/',
    ME: '/auth/me/',
    CHANGE_PASSWORD: '/auth/change-password/',
    CSRF: '/auth/csrf/',
  },

  CONFIG: '/config/',

  // Member-facing tip list. Served by TipsView in apps/core/views.py.
  // The backend falls back to the default locale when the requested
  // one has no active tips, and reports the resolved locale in the
  // response body.
  TIPS: '/tips/',

  // Capability panel endpoints. Both routes live under the auth
  // prefix (see apps/users/urls.py) and are gated server-side by
  // 'admin.permissions'.
  PERMISSIONS: {
    ROLES: '/auth/admin/permissions/',
    USER: (userId) => `/auth/admin/permissions/users/${userId}/`,
  },

  ANALYTICS: {
    SUMMARY: '/analytics/summary/',
    ACTIVE_USERS: '/analytics/active-users/',

    // Member-facing advanced reports (features 1, 3)
    CATEGORY_MASTERY: '/analytics/category-mastery/',
    STREAK_HISTORY: '/analytics/streak-history/',

    // Admin advanced reports (features 4-8). Each has its own URL so
    // the frontend can lazy-load exactly the reports the user
    // expands, and so per-report caching/throttling can be tuned
    // without touching a shared endpoint.
    ADMIN_DIFFICULTY_CALIBRATION: '/analytics/admin/difficulty-calibration/',
    ADMIN_AUTHOR_FLAG_RATE: '/analytics/admin/author-flag-rate/',
    ADMIN_EXAM_DURATION: '/analytics/admin/exam-duration/',
    ADMIN_COHORT_COMPARISON: '/analytics/admin/cohort-comparison/',
    ADMIN_WEEKLY_RETENTION: '/analytics/admin/retention/',
  },

  STUDY_PLANNER: {
    BASE: '/study-planner/',
    UPDATE: '/study-planner/update/',
    PROGRESS: '/study-planner/progress/',
    DELETE: '/study-planner/delete/',
  },

  STREAK: '/study/streak/',
  ACTIVITY_HEATMAP: '/study/activity-heatmap/',

  GROUPS: {
    MINE: '/study/groups/mine/',
    LEADERBOARD: (id) => `/study/groups/${id}/leaderboard/`,
    VISIBILITY: (id) => `/study/groups/${id}/visibility/`,
    ADMIN_LIST: '/study/admin/groups/',
    ADMIN_DETAIL: (id) => `/study/admin/groups/${id}/`,
    ADMIN_MEMBERS: (id) => `/study/admin/groups/${id}/members/`,
    ADMIN_MEMBER: (id, userId) => `/study/admin/groups/${id}/members/${userId}/`,
  },

  QUESTIONS: {
    BASE: '/questions/',
    BATCH: '/questions/batch/',
    TAGS: '/questions/tags/',
    AVAILABLE_COUNT: '/questions/available-count/',
    UNVERIFIED: '/questions/unverified/',
    BULK_VERIFY: '/questions/bulk-verify/',
    BULK_TAGS: '/questions/bulk-tags/',
    VERIFY: (id) => `/questions/${id}/verify/`,
    FLAG: (id) => `/questions/${id}/flag/`,
    ITEM: (id) => `/questions/${id}/`,
    DUPLICATE: (id) => `/questions/${id}/duplicate/`,
    RATING: (id) => `/questions/${id}/rating/`,
    RATE: (id) => `/questions/${id}/rate/`,
    // Batch ratings. One request per list render instead of one per
    // card — see QuestionRatingsBatchView for the wire contract.
    RATINGS_BATCH: '/questions/ratings/',
    IMAGE: (id) => `/questions/${id}/image/`,
    MISTAKES: '/questions/mistakes/',
    FRAGILE: '/questions/fragile/',
    ATTEMPT_SUMMARY: '/questions/attempt-summary/',
    SRS_DUE_COUNT: '/questions/srs-due-count/',
    STUDY_NOW: '/questions/study-now/',

    CASES_LIST: '/questions/cases/',
    CASES_DETAIL: (key) => `/questions/cases/${encodeURIComponent(key)}/`,
    CASES_STEM: (key) => `/questions/case/${encodeURIComponent(key)}/stem/`,
  },

  EXAM: {
    START: '/exam/start/exam/',
    QUESTION: '/exam/question/',
    ANSWER: '/exam/answer/',
    RESULTS: '/exam/results/',
    PAUSE: '/exam/pause/',
    RESUME: '/exam/resume/',
    DISCARD: '/exam/discard/',
    STATUS: '/exam/status/',
    BLUEPRINTS: '/exam/blueprints/',
    BLUEPRINT: (id) => `/exam/blueprints/${id}/`,
  },

  MASTER_EXAMS: {
    LIST: '/exam/master/',
    DETAIL: (id) => `/exam/master/${id}/`,
    ADD_QUESTIONS: (id) => `/exam/master/${id}/questions/add/`,
    REMOVE_QUESTION: (id) => `/exam/master/${id}/questions/remove/`,
    REORDER: (id) => `/exam/master/${id}/questions/reorder/`,
    ADD_DRAFT: (id) => `/exam/master/${id}/drafts/`,
    PUBLISH: (id) => `/exam/master/${id}/publish/`,
    CANCEL: (id) => `/exam/master/${id}/cancel/`,
    PUBLISH_TO_BANK: (id) => `/exam/master/${id}/publish-to-bank/`,
    ACKNOWLEDGE: (id) => `/exam/master/${id}/acknowledge/`,
    NEEDS_ACK: '/exam/master/needs-acknowledgement/',
    START_ATTEMPT: (id) => `/exam/master/${id}/start/`,
    ATTEMPT_STATUS: (id) => `/exam/master/${id}/attempt/status/`,
    ATTEMPT_QUESTION: (id) => `/exam/master/${id}/attempt/question/`,
    ATTEMPT_ANSWER: (id) => `/exam/master/${id}/attempt/answer/`,
    ATTEMPT_GOTO: (id) => `/exam/master/${id}/attempt/goto/`,
    ATTEMPT_FINISH: (id) => `/exam/master/${id}/attempt/finish/`,
    ATTEMPT_FLAG: (id) => `/exam/master/${id}/attempt/flag/`,
    RESULTS: (id) => `/exam/master/${id}/results/`,
    RESULTS_SUMMARY_CSV: (id) => `/exam/master/${id}/results/summary.csv/`,
    RESULTS_MATRIX_CSV: (id) => `/exam/master/${id}/results/matrix.csv/`,
    DRAFTS_LIBRARY: '/exam/master/drafts/',
    DRAFT_DETAIL: (draftId) => `/exam/master/drafts/${draftId}/`,
  },

  STUDY: {
    START: '/study/start/study/',
    QUESTION: '/study/question/',
    ANSWER: '/study/answer/',
    RESULTS: '/study/results/',
    PAUSE: '/study/pause/',
    RESUME: '/study/resume/',
    DISCARD: '/study/discard/',
    STATUS: '/study/status/',
  },

  BOOKMARKS: {
    BASE: '/questions/bookmarks/',
    TOGGLE: (id) => `/questions/${id}/bookmark/`,
    COUNT: '/questions/bookmarks/count/',
  },

  CATEGORIES: {
    BASE: '/questions/categories/',
    CREATE: '/questions/categories/create/',
    UPDATE: (id) => `/questions/categories/${id}/update/`,
    DELETE: (id) => `/questions/categories/${id}/delete/`,
  },

  ADMIN: {
    USERS: '/auth/admin/users/',
    USER: (id) => `/auth/admin/users/${id}/`,
    USER_TOGGLE: (id) => `/auth/admin/users/${id}/toggle/`,
    USER_RESET_PASSWORD: (id) => `/auth/admin/users/${id}/reset-password/`,
    SETTINGS: '/admin/settings/',
    VERIFICATION_STATS: '/analytics/verification-stats/',
    FLAGS: '/questions/admin/flags/',
    FLAG_RESOLVE: (id) => `/questions/admin/flags/${id}/resolve/`,
    ACTIVE_USERS: '/auth/admin/active-users/',
    TAGS_TREE: '/questions/admin/tags/tree/',
    TAG_RENAME: (name) => `/questions/admin/tags/${encodeURIComponent(name)}/rename/`,
    TAG_DELETE: (name) => `/questions/admin/tags/${encodeURIComponent(name)}/delete/`,
    TAG_MERGE: '/questions/admin/tags/merge/',
    HISTORY: '/admin/history/',
    SEED_SAMPLE_QUESTIONS: '/admin/seed-sample-questions/',
    REFRESH_AUTHOR_RANKS: '/admin/refresh-author-ranks/',
  },

  DATABASE: {
    INFO: '/database/info/',
    BACKUP: '/database/backup/',
    BACKUPS: '/database/backups/',
    RESTORE: '/database/restore/',
    CLEAR: '/database/clear/',
    IMPORT: '/database/import/',
    IMPORT_TELEGRAM: '/database/import/telegram/',
    EXPORT_STATE: '/database/export/state/',
    IMPORT_STATE: '/database/import/state/',
    EXPORT: (format) => `/database/export/${format}/`,
    EXPORT_VERIFIED: (format) => `/database/export/${format}/verified/`,
  },

  HISTORY: {
    BASE: '/history/',
  },
}

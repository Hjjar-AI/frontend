// Shared metadata for every non-admin navigation surface. Admin-only
// destinations remain in adminLinks.js because they have a stricter
// route/capability contract.
export const NAVIGATION_LINKS = [
  { id: 'home', to: '/', icon: 'bi bi-house-fill', labelKey: 'nav.home', bottomNav: true, exact: true },
  { id: 'questions', to: '/questions', icon: 'bi bi-question-circle-fill', labelKey: 'nav.questions', desktop: 'content', bottomNav: true, activePrefixes: ['/questions', '/categories', '/knowledge-map'] },
  { id: 'add-question', to: '/questions/add', icon: 'bi bi-plus-circle', labelKey: 'nav.addQuestion', desktop: 'content', capability: 'questions.create' },
  { id: 'review', to: '/questions/review', icon: 'bi bi-check2-all', labelKey: 'nav.review', desktop: 'content', moreSheet: 'general' },
  { id: 'mistakes', to: '/questions/mistakes', icon: 'bi bi-journal-x', labelKey: 'nav.mistakes', desktop: 'content', moreSheet: 'general' },
  { id: 'fragile', to: '/questions/fragile', icon: 'bi bi-shield-slash', labelKey: 'nav.fragile', desktop: 'content', moreSheet: 'general' },
  { id: 'categories', to: '/categories', icon: 'bi bi-folder2', labelKey: 'nav.categories', desktop: 'content', moreSheet: 'general' },
  { id: 'bookmarks', to: '/bookmarks', icon: 'bi bi-bookmark-heart-fill', labelKey: 'nav.bookmarks', desktop: 'content', bottomNav: true },
  { id: 'knowledge-map', to: '/knowledge-map', icon: 'bi bi-map', labelKey: 'nav.knowledgeMap', desktop: 'content', moreSheet: 'general' },
  { id: 'study', to: '/study', icon: 'bi bi-journal-check', labelKey: 'nav.studyMode', shortLabelKey: 'nav.studyModeShort', desktop: 'tests', bottomNav: true, activePrefixes: ['/exam', '/study', '/recall', '/master-exams'] },
  { id: 'master-exams', to: '/master-exams', icon: 'bi bi-mortarboard', labelKey: 'nav.masterExams', desktop: 'tests', moreSheet: 'general' },
  { id: 'manual', to: '/manual', icon: 'bi bi-book', labelKey: 'nav.manual', desktop: 'top', moreSheet: 'general' },
  { id: 'analytics', to: '/analytics', icon: 'bi bi-graph-up', labelKey: 'nav.analytics', desktop: 'top', moreSheet: 'general' },
  { id: 'about', to: '/about', icon: 'bi bi-info-circle', labelKey: 'nav.about', moreSheet: 'general' },
  { id: 'groups', to: '/groups', icon: 'bi bi-people-fill', labelKey: 'nav.myGroups', moreSheet: 'general' },
  { id: 'planner', to: '/planner', icon: 'bi bi-calendar-check', labelKey: 'nav.planner', moreSheet: 'general' },
  { id: 'history', to: '/history', icon: 'bi bi-clock-history', labelKey: 'nav.history', moreSheet: 'general' },
  { id: 'preferences', to: '/preferences', icon: 'bi bi-sliders', labelKey: 'nav.settings', moreSheet: 'general' },
  { id: 'new-master-exam', to: '/master-exams/new', icon: 'bi bi-plus-circle', labelKey: 'nav.newMasterExam', moreSheet: 'master', capability: 'master_exams.create' },
  { id: 'drafts-library', to: '/master-exams/drafts', icon: 'bi bi-journal-text', labelKey: 'nav.draftsLibrary', moreSheet: 'master', capability: 'master_exams.drafts_library' },
]

export const navigationLinksFor = (surface, value = true) =>
  NAVIGATION_LINKS.filter(link => link[surface] === value)

export function isNavigationLinkActive(link, path) {
  if (link.exact) return path === link.to
  const prefixes = link.activePrefixes || [link.to]
  return prefixes.some(prefix => path === prefix || path.startsWith(`${prefix}/`))
}

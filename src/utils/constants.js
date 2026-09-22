// frontend/src/utils/constants.js
import { version } from '../../package.json'

export const APP_NAME = 'مُختبِر'
export const APP_VERSION = version

export const FALLBACK_MAX_QUIZ_QUESTIONS = 200
export const FALLBACK_MAX_CHOICES = 8
export const FALLBACK_ITEMS_PER_PAGE = 20

export const THEMES = ['light', 'dark', 'blossom', 'fresh']

export const ROLES = {
  ADMIN: 'admin',
  MODERATOR: 'moderator',
  MEMBER: 'member',
}

export const ROLE_LABEL_KEYS = {
  [ROLES.ADMIN]: 'roles.admin',
  [ROLES.MODERATOR]: 'roles.moderator',
  [ROLES.MEMBER]: 'roles.member',
}

export const PER_PAGE_OPTIONS = [10, 20, 50, 100]

// ──────────────────────────────────────────────────────────────────
// DIFFICULTY REGISTRY
//
// This is the single source of truth for difficulty display
// metadata. Three call sites share it:
//
//   • DifficultySelector.vue                     — question form
//   • DifficultyCalibrationCard.vue              — analytics
//   • MasterExamEditor.vue, MasterExamDrafts.vue — master exams
//
// Before this consolidation each of those re-declared its own
// `easy/medium/hard` label map (and, in the analytics card, a
// colour map). A change to a label key, an icon, or an accent
// colour had to be replicated by hand across three files and stayed
// in sync only if the person making the change found all three.
//
// `color` values are CSS variable references, not literal hex.
// They follow the active theme automatically.
//
// `labelKey` is an i18n key, not a resolved label. Consumers call
// `t(opt.labelKey)` in a component scope, or use the two helpers
// below when they need a value-keyed lookup.
// ──────────────────────────────────────────────────────────────────
export const DIFFICULTY_OPTIONS = [
  {
    value: 'easy',
    labelKey: 'difficulty.easy',
    icon: 'bi bi-emoji-smile',
    color: 'var(--color-success)',
  },
  {
    value: 'medium',
    labelKey: 'difficulty.medium',
    icon: 'bi bi-emoji-neutral',
    color: 'var(--color-warning)',
  },
  {
    value: 'hard',
    labelKey: 'difficulty.hard',
    icon: 'bi bi-emoji-frown',
    color: 'var(--color-danger)',
  },
]

export const DIFFICULTY_LABEL_KEYS = Object.fromEntries(
  DIFFICULTY_OPTIONS.map(opt => [opt.value, opt.labelKey])
)

// Value-keyed lookup for the full entry. Consumers that need more
// than the label key (icon, colour) read the entry from here
// instead of re-declaring the metadata.
export const DIFFICULTY_BY_VALUE = Object.fromEntries(
  DIFFICULTY_OPTIONS.map(opt => [opt.value, opt])
)

/**
 * Resolve a difficulty value to its localized label.
 *
 * Falls back to the raw value so a backend-added difficulty remains
 * visible rather than blanking the cell.
 *
 * @param {string} value  difficulty code ('easy', 'medium', 'hard',
 *                        or any future value the backend adds)
 * @param {Function} t    the i18n `t` function from useI18n() or
 *                        i18n.global.t — passed in rather than
 *                        imported so this stays usable from both a
 *                        component scope and a plain module
 */
export function difficultyLabelFor(value, t) {
  const opt = DIFFICULTY_BY_VALUE[value]
  return opt ? t(opt.labelKey) : value
}

/**
 * Resolve a difficulty value to its registry colour.
 *
 * The fallback matches the behaviour of the local implementation
 * this helper replaced in `DifficultyCalibrationCard.vue`: an
 * unknown value is rendered in the warning accent, not the primary
 * accent. That is the "cannot classify" signal the analytics view
 * was already using and it stays the same here so the consolidation
 * is a pure refactor rather than a visual change.
 */
export function difficultyColorFor(value) {
  return DIFFICULTY_BY_VALUE[value]?.color || 'var(--color-warning)'
}

// ── Motivational quotes ────────────────────────────────────────────
//
// The prior locale-aware Proxy alias `MOTIVATIONAL_QUOTES` has been
// deleted. It reported `Array.isArray() === false`, produced a fresh
// array on every property access, and had no live callers — the
// results page uses `selectMotivationalQuotes(locale.value)`
// directly.
export const MOTIVATIONAL_QUOTES_AR = [
  'كل سؤال هو خطوة نحو المعرفة.',
  'التكرار أمهر معلم.',
  'النجاح هو نتيجة الجهد المستمر.',
  'لا تيأس، فكل محاولة تقربك للإتقان.',
  'العلم نور، وكل إجابة صحيحة تزيده إشراقاً.',
  'أحسنت! واصل التقدم.',
  'التعلم رحلة لا تنتهي، استمتع بها.',
  'وراء كل طبيب ناجح، ساعات من المذاكرة ذاتية.',
  'وَمَا نَيْلُ الْمَطَالِبِ بِالتَّمَنِّي، وَلَكِنْ تُؤْخَذُ الدُّنْيَا غِلَابًا.',
  'تَعَلَّمْ فَلَيْسَ الْمَرْءُ يُولَدُ عَالِمًا، وَلَيْسَ أَخُو عِلْمٍ كَمَنْ هُوَ جَاهِلُ.',
  'مَنْ يَتَهَيَّبُ صُعُودَ الْجِبَالِ، يَعِشْ أَبَدَ الدَّهْرِ بَيْنَ الْحُفَرِ.',
  'وَاصْبِرْ عَلَى طَلَبِ الْعُلَا فَإِنَّ الْفَوْزَ ... بِالصَّبْرِ وَالْعَزْمِ تُدْرَكُ الْغَايَاتُ.',
  'إِذَا لَمْ تَكُنْ لِلنَّفْسِ هِمَّةٌ تُعِينُهَا، فَلَا تَلُمْهَا إِذَا سَارَتْ إِلَى الْفَنَا.',
  'وَمَنْ طَلَبَ الْعُلَا سَهِرَ اللَّيَالِيَا، وَمَنْ رَامَ الْعَلَاءَ صَبَرَ النَّوَائِبَا.',
  'أَلَا لَا تَظُنَّ الْعِلْمَ يَأْتِي مُهَدَّدًا، وَلَكِنَّهُ يُعْطَى لِمَنْ يَتَعَنَّى.',
  'يَقُولُ الْمَرْءُ قَدْ ضَاعَ الْعُمُرُ، فَقُلْ لَهُ: أَلَيْسَ الْعِلْمُ مَا يُبْقِي الْعُمُرَ؟',
  'وَمَنْ لَمْ يَذُقْ مُرَّ التَّعَلُّمِ سَاعَةً ... تَجَرَّعَ ذُلَّ الْجَهْلِ طُولَ حَيَاتِهِ.',
  'تَعِبْتُ فَنِلْتُ الْعِلْمَ وَالْفَضْلَ كُلَّهُ ... وَمَنْ لَمْ يَتَعَبْ يَقْضِ حَيَاتَهُ خَاسِرًا.',
  'لَا تَحْسَبَنَّ الْعُلُومَ تُنَالُ بِالْمُنَى ... فَالنَّجْمُ لَا يُلْمَسُ إِلَّا بِالْمَشَقَّاتِ.',
  'مَنْ يَهَبْ نَفْسَهُ لِلْعِلْمِ يَظْفَرْ بِالْهُدَى ... وَمَنْ يُضِعْ وَقْتَهُ يَخْسَرْ أَيَّامَهُ.',
  'وَالصَّبْرُ كَالنُّورِ يُضِيءُ الطَّرِيقَا ... إِذَا مَا اعْتَرَتْهُ غَيَاهِبُ الْعُسْرِ وَالضِّيقَا.',
  'خُذِ الْعِلْمَ مِنْ أَفْوَاهِ الرِّجَالِ وَلَا تَقِفْ ... عِنْدَ الْجَهْلِ مَا حَيِيتَ فَهُوَ شَقَاءُ.',
  'قَدْرُ الْفَتَى فِي النَّاسِ عِلْمُهُ وَتُقَاهُ ... فَمَا أَشْرَفَ الْعِلْمَ وَأَكْرَمَ أَهْلَهُ.',
  'وَإِنَّ اللَّيَالِيَ الْعِشْرِ إِنْ ضَيَّعْتَهَا ... نَدِمْتَ عَلَى أَيَّامِهَا بِالْحَسَرَاتِ.',
  'أَلَا إِنَّ الْفَتَى يَوْمًا إِذَا جَدَّ فِي السُّرَى ... نَهَارُهُ مَمْلُوءٌ وَفَوْزُهُ قَرِيبُ.',
  'إِنَّ الْعُلُومَ كَبَحْرٍ لَيْسَ يُدْرِكُهُ ... إِلَّا الَّذِينَ سَخَوْا بِالْجِدِّ وَالْيَقَظَاتِ.',
  'مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا، سَهَّلَ اللَّهُ لَهُ بِهِ طَرِيقًا إِلَى الْجَنَّةِ.',
  'إِنَّ اللَّهَ يُحِبُّ إِذَا عَمِلَ أَحَدُكُمْ عَمَلًا أَنْ يُتْقِنَهُ.',
  'وَمَنْ يُرِدِ اللَّهُ بِهِ خَيْرًا يُفَقِّهْهُ فِي الدِّينِ.',
  'احْرِصْ عَلَىٰ مَا يَنْفَعُكَ، وَاسْتَعِنْ بِاللَّهِ وَلَا تَعْجَزْ.',
  'مَنْ جَدَّ وَجَدَ، وَمَنْ زَرَعَ حَصَدَ.',
  'نِعْمَتَانِ مَغْبُونٌ فِيهِمَا كَثِيرٌ مِنَ النَّاسِ: الصِّحَّةُ وَالْفَرَاغُ.',
  'إِنَّ لِرَبِّكُمْ عَلَيْكُمْ حَقًّا، وَلِنَفْسِكُمْ عَلَيْكُمْ حَقًّا، فَأَعْطُوا كُلَّ ذِي حَقٍّ حَقَّهُ.',
  'إنَّ الْعِلْمَ بِالتَّعَلُّمِ، وَالْحِلْمَ بِالتَّحَلُّمِ، وَمَنْ يَتَحَرَّ الْخَيْرَ يُعْطَهُ.',
  'اَلْعِلْمُ صَيْدٌ، وَالْكِتَابَةُ قَيْدُهُ، فَقَيِّدْ صَيْدَكَ بِالْحِبَالِ الْوَثِيقَةِ.',
  'خَيْرُ جَلِيسٍ فِي الزَّمَانِ كِتَابُ، تَصِلُ بِهِ الْأَلْبَابَ وَالْأَحْسَابَا.',
  'لَا يَحْزُنْكَ كَثْرَةُ الْأَسْئِلَةِ، فَكُلُّ سُؤَالٍ يَفْتَحُ بَابًا مِنَ الْفَهْمِ.',
  'بِالْعِلْمِ تُدْرَكُ الْجَنَّاتُ، وَبِالْجُهُلِ تُغْلَقُ الْأَبْوَابُ.',
  'إِذَا أَرَدْتَ أَنْ تَعْلَمَ فَاسْأَلْ، وَإِنْ خِفْتَ الْخَطَأَ فَاسْتَقِرْ وَلَا تَكْتَرِثْ.',
]

export const MOTIVATIONAL_QUOTES_EN = [
  'Every question is a step toward knowledge.',
  'Repetition is the most skilled teacher.',
  'Success is the result of continuous effort.',
  'Do not despair — every attempt brings you closer to mastery.',
  'Knowledge is light, and every correct answer makes it brighter.',
  'Well done! Keep going.',
  'Learning is a journey without end — enjoy it.',
  'Behind every successful physician are hours of self-study.',
  'The prize is not won by wishing; the world is won by striving.',
  'Learn, for no one is born a scholar, and the learned are not like the ignorant.',
  'Whoever fears climbing mountains will live forever among the ditches.',
  'Be patient in seeking the heights — victory is attained through patience and resolve.',
  'If the soul has no ambition to aid it, do not blame it when it drifts into nothingness.',
  'Whoever seeks the heights spends his nights awake, and whoever desires greatness endures hardships.',
  'Do not think knowledge comes easily — it is given only to those who strive.',
  'A person says "my life is wasted" — tell them: is not knowledge what makes life endure?',
  'I toiled and gained all knowledge and virtue; whoever does not toil wastes his life in loss.',
  'Do not suppose sciences are attained by wishful thinking — the stars are only reached through hardships.',
  'Whoever devotes himself to knowledge attains guidance; whoever wastes his time loses his days.',
  'Patience is like light that illuminates the road when the darkness of hardship tightens.',
  'Take knowledge from the mouths of men; do not remain in ignorance throughout your life, for it is misery.',
  'The worth of a person among people is his knowledge and his piety — how noble is knowledge and how honoured its people.',
  'If you waste the nights of your life, you will regret its days with sorrow.',
  'Indeed, the youth who strives on his path has his day filled, and his success is near.',
  'Sciences are like a sea no one can encompass except those who give generously of effort and wakefulness.',
  'Whoever takes a path seeking knowledge, God eases for him a path to Paradise.',
  'God loves that when one of you does a job, he perfects it.',
  'Whomever God wishes good for, He grants understanding in religion.',
  'Be keen on what benefits you, seek God\'s aid, and do not be helpless.',
  'Whoever strives, finds; whoever sows, reaps.',
  'Two blessings many people squander: health and free time.',
  'Give each rightful person his right.',
  'Knowledge comes through learning, forbearance through practice; and whoever seeks good is given it.',
  'Knowledge is prey, and writing is its chain — so chain your prey with firm ropes.',
  'The best companion of our time is a book — through it you connect with minds and honours.',
  'Do not be saddened by many questions — every question opens a door of understanding.',
  'Through knowledge, gardens are reached; through ignorance, doors are closed.',
  'If you wish to know, ask; if you fear error, be still and do not be anxious.',
]

export function selectMotivationalQuotes(locale) {
  return locale === 'en' ? MOTIVATIONAL_QUOTES_EN : MOTIVATIONAL_QUOTES_AR
}

// NOTE on scope
// -------------
// `FALLBACK_DASHBOARD_TIPS_AR` / `FALLBACK_DASHBOARD_TIPS_EN` /
// `selectDashboardTips` deliberately do NOT live in this file. They
// are exported by `frontend/src/utils/dashboardTips.js`, which is
// the only path any consumer imports them from. Duplicating them
// here would create two sources of truth for the same names.
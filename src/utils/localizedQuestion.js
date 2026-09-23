function localeCandidates(locale) {
  const normalized = String(locale || '').trim().replaceAll('_', '-')
  if (!normalized) return []
  const [language, region] = normalized.split('-')
  const canonical = region ? `${language.toLowerCase()}-${region.toUpperCase()}` : language.toLowerCase()
  return canonical === language.toLowerCase()
    ? [canonical]
    : [canonical, language.toLowerCase()]
}

export function questionTranslation(question, locale) {
  const translations = question?.translations
  if (!translations || typeof translations !== 'object') return null
  for (const candidate of localeCandidates(locale)) {
    if (translations[candidate]) return translations[candidate]
  }
  return null
}

export function localizedQuestion(question, locale) {
  if (!question) return question
  const translation = questionTranslation(question, locale)
  if (!translation?.question) return question

  const originalChoices = Array.isArray(question.choices) ? question.choices : []
  const translatedChoices = Array.isArray(translation.choices) ? translation.choices : []
  const choices =
    translatedChoices.length === originalChoices.length && translatedChoices.every(Boolean)
      ? translatedChoices
      : originalChoices

  return {
    ...question,
    question: translation.question,
    text: translation.question,
    choices,
    explanation: translation.explanation || question.explanation,
  }
}

import { describe, expect, it } from 'vitest'
import { localizedQuestion, questionTranslation } from '@/utils/localizedQuestion'


const question = {
  question: 'Original?',
  text: 'Original?',
  choices: ['A', 'B'],
  explanation: 'Original explanation',
  translations: {
    ar: {
      question: 'الأصل؟',
      choices: ['أ', 'ب'],
      explanation: 'شرح',
    },
    'en-US': {
      question: 'US wording?',
      choices: [],
      explanation: '',
    },
  },
}


describe('localizedQuestion', () => {
  it('uses a complete locale variant without changing answer positions', () => {
    const localized = localizedQuestion(question, 'ar')

    expect(localized.question).toBe('الأصل؟')
    expect(localized.text).toBe('الأصل؟')
    expect(localized.choices).toEqual(['أ', 'ب'])
    expect(localized.explanation).toBe('شرح')
  })

  it('falls back to base choices and explanation when translations omit them', () => {
    const localized = localizedQuestion(question, 'en-US')

    expect(localized.question).toBe('US wording?')
    expect(localized.choices).toEqual(['A', 'B'])
    expect(localized.explanation).toBe('Original explanation')
  })

  it('falls back from a regional locale to its base language', () => {
    expect(questionTranslation(question, 'ar-SY')).toEqual(question.translations.ar)
  })
})

// frontend/src/utils/importParsers.js
import { i18n } from '@/i18n'
import { FALLBACK_MAX_CHOICES } from '@/utils/constants'

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024
const MAX_PREVIEW_ROWS = 100
const MAX_CSV_PREVIEW_BYTES = 2 * 1024 * 1024

function t(key, params) {
  return i18n.global.t(key, params || {})
}

function validateFileSize(file) {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(
      t('utility.fileTooLarge', {
        size: (file.size / 1024 / 1024).toFixed(1),
        max: 50,
      })
    )
  }
}

function readFileAsText(file, sliceBytes = null) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = () => reject(new Error(t('utility.fileReadFailed')))

    if (sliceBytes !== null && file.size > sliceBytes) {
      reader.readAsText(file.slice(0, sliceBytes))
    } else {
      reader.readAsText(file)
    }
  })
}

export async function parseJsonFile(file) {
  validateFileSize(file)
  const text = await readFileAsText(file)

  let data
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error(t('utility.invalidJsonFile'))
  }

  const items = Array.isArray(data) ? data : [data]
  const questions = []
  const limit = Math.min(items.length, MAX_PREVIEW_ROWS)

  for (let i = 0; i < limit; i++) {
    const item = items[i]
    const choices = Array.isArray(item?.choices)
      ? item.choices
      : [
          item?.choice_1, item?.choice_2, item?.choice_3, item?.choice_4,
          item?.choice_5, item?.choice_6, item?.choice_7, item?.choice_8,
        ]
    questions.push({
      question: item?.question || '',
      choices: choices.filter(c => c != null && String(c).trim() !== ''),
      correctAnswer: parseInt(item?.correct_answer, 10) || 1,
    })
  }

  return questions
}

export async function parseCsvFile(file) {
  validateFileSize(file)
  const previewWasTruncated = file.size > MAX_CSV_PREVIEW_BYTES
  const text = await readFileAsText(file, MAX_CSV_PREVIEW_BYTES)
  // Parse records in one pass so CR/LF inside a quoted cell remains part of
  // that cell. Splitting into lines first only resembles CSV and corrupted
  // RFC-style multiline records.
  const records = []
  let row = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      row.push(current)
      current = ''
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && text[i + 1] === '\n') i++
      row.push(current)
      if (row.some(cell => cell.trim() !== '')) records.push(row)
      row = []
      current = ''
    } else {
      current += char
    }
  }
  // A sliced preview can end in the middle of a quoted record. Do not show a
  // fabricated partial question in that case; the backend still imports the
  // complete upload.
  if (!previewWasTruncated || !inQuotes) {
    row.push(current)
    if (row.some(cell => cell.trim() !== '')) records.push(row)
  }

  if (records.length < 2) return []

  const headers = records[0].map((header, index) => {
    const normalized = header.trim().toLowerCase()
    return index === 0 ? normalized.replace(/^\uFEFF/, '') : normalized
  })
  const questions = []
  const limit = Math.min(records.length, MAX_PREVIEW_ROWS + 1)

  for (let i = 1; i < limit; i++) {
    const values = records[i]
    const row = {}
    headers.forEach((h, idx) => {
      row[h] = (values[idx] || '').trim()
    })

    if (row.question) {
      questions.push({
        question: row.question,
        choices: [
          row.choice_1, row.choice_2, row.choice_3, row.choice_4,
          row.choice_5, row.choice_6, row.choice_7, row.choice_8,
        ].filter(c => c && String(c).trim() !== ''),
        correctAnswer: parseInt(row.correct_answer, 10) || 1,
      })
    }
  }

  return questions
}


export async function parseTelegramFile(file, options = {}) {
  const { maxChoices = FALLBACK_MAX_CHOICES } = options

  validateFileSize(file)
  const text = await readFileAsText(file)

  let data
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error(t('utility.invalidJsonFile'))
  }

  const messages = Array.isArray(data?.messages) ? data.messages : []
  const questions = []
  let count = 0

  for (const msg of messages) {
    if (count >= MAX_PREVIEW_ROWS) break
    if (!msg?.poll) continue

    const poll = msg.poll
    const qText = (poll.question || '').trim()
    if (!qText) continue

    const rawAnswers = Array.isArray(poll.answers) ? poll.answers : []

    const filteredAnswers = []
    for (const ans of rawAnswers) {
      const textValue = (ans?.text || '').toString().trim()
      if (!textValue) continue
      filteredAnswers.push({
        text: textValue,
        chosen: Boolean(ans?.chosen),
        voters: Number(ans?.voters) || 0,
      })
    }

    if (filteredAnswers.length < 2) continue
    if (filteredAnswers.length > maxChoices) continue

    const choices = filteredAnswers.map(a => a.text)
    let correct = 1
    let guessed = false

    const chosenIndex = filteredAnswers.findIndex(a => a.chosen)
    if (chosenIndex !== -1) {
      correct = chosenIndex + 1
    } else {
      guessed = true
      let maxVotes = -1
      filteredAnswers.forEach((a, idx) => {
        if (a.voters > maxVotes) {
          maxVotes = a.voters
          correct = idx + 1
        }
      })
    }

    // The explanation is server-visible text — it lands on a Question
    // the user will later see in their own locale. Only the fallback
    // "guessed" prefix is generated client-side; keep it in the
    // ACTIVE locale at parse time. The user can edit the question
    // afterwards if they want a different language.
    const explanation = guessed
      ? t('utility.telegramGuessedExplanation')
      : (msg.text || '').slice(0, 200)

    questions.push({
      question: qText.slice(0, 500),
      choices,
      correctAnswer: correct,
      tags: '',
      explanation,
    })

    count++
  }

  return questions
}

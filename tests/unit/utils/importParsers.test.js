// frontend/tests/unit/utils/importParsers.test.js
import { describe, it, expect } from 'vitest'
import {
  parseCsvFile,
  parseJsonFile,
  parseTelegramFile,
} from '@/utils/importParsers'

function makeFile(content, name, type = 'text/plain') {
  return new File([content], name, { type })
}

describe('parseJsonFile', () => {
  it('parses a top-level array of questions', async () => {
    const json = JSON.stringify([
      { question: 'Q1', choice_1: 'a', choice_2: 'b', correct_answer: 1 },
    ])
    const result = await parseJsonFile(makeFile(json, 'q.json'))
    expect(result).toHaveLength(1)
    expect(result[0].question).toBe('Q1')
    expect(result[0].choices).toEqual(['a', 'b'])
    expect(result[0].correctAnswer).toBe(1)
  })

  it('wraps a single-object top level in an array', async () => {
    const json = JSON.stringify({
      question: 'Q1', choice_1: 'a', choice_2: 'b', correct_answer: 2,
    })
    const result = await parseJsonFile(makeFile(json, 'q.json'))
    expect(result).toHaveLength(1)
    expect(result[0].correctAnswer).toBe(2)
  })

  it('drops empty choices', async () => {
    const json = JSON.stringify([
      { question: 'Q1', choice_1: 'a', choice_2: '', choice_3: 'c', correct_answer: 2 },
    ])
    const result = await parseJsonFile(makeFile(json, 'q.json'))
    expect(result[0].choices).toEqual(['a', 'c'])
  })

it('rejects an oversized file', async () => {
  // The validator reads `file.size` and throws before
  // `readFileAsText` is ever called. Allocating a real 51 MB body
  // and letting happy-dom copy it into a File cost ~230 ms for a
  // check that only needs the size property. A tiny body with an
  // oversized `size` exercises the exact same code path in <1 ms.
  const file = makeFile('{}', 'big.json')
  Object.defineProperty(file, 'size', { value: 51 * 1024 * 1024 })
  await expect(parseJsonFile(file)).rejects.toThrow(/large|حجم/i)
})

  it('rejects malformed JSON', async () => {
    await expect(parseJsonFile(makeFile('{not valid json', 'bad.json'))).rejects.toThrow(/invalid|صالح/i)
  })
})

describe('parseCsvFile — simple cases', () => {
  it('parses a two-column CSV with the required headers', async () => {
    const csv = ['question,choice_1,choice_2,correct_answer', 'Q1,a,b,1', 'Q2,c,d,2'].join('\n')
    const result = await parseCsvFile(makeFile(csv, 'q.csv'))
    expect(result).toHaveLength(2)
    expect(result[0].question).toBe('Q1')
    expect(result[0].choices).toEqual(['a', 'b'])
    expect(result[0].correctAnswer).toBe(1)
    expect(result[1].question).toBe('Q2')
  })

  it('handles CRLF line endings', async () => {
    const csv = 'question,choice_1,choice_2,correct_answer\r\nQ1,a,b,1\r\n'
    const result = await parseCsvFile(makeFile(csv, 'q.csv'))
    expect(result).toHaveLength(1)
    expect(result[0].question).toBe('Q1')
  })

  it('skips blank lines', async () => {
    const csv = 'question,choice_1,choice_2,correct_answer\n\nQ1,a,b,1\n\n'
    const result = await parseCsvFile(makeFile(csv, 'q.csv'))
    expect(result).toHaveLength(1)
  })

  it('drops rows with no question text', async () => {
    const csv = 'question,choice_1,choice_2,correct_answer\n,a,b,1\nQ1,c,d,1'
    const result = await parseCsvFile(makeFile(csv, 'q.csv'))
    expect(result).toHaveLength(1)
    expect(result[0].question).toBe('Q1')
  })
})

describe('parseCsvFile — quote handling', () => {
  it('keeps commas inside quoted cells', async () => {
    const csv = 'question,choice_1,choice_2,correct_answer\n"a, b",x,y,1'
    const result = await parseCsvFile(makeFile(csv, 'q.csv'))
    expect(result[0].question).toBe('a, b')
  })

  it('unescapes doubled quotes ("") inside a quoted cell', async () => {
    const csv = 'question,choice_1,choice_2,correct_answer\n"the ""best"" answer",x,y,1'
    const result = await parseCsvFile(makeFile(csv, 'q.csv'))
    expect(result[0].question).toBe('the "best" answer')
  })

  it('handles a quoted cell containing a newline', async () => {
    const csv = 'question,choice_1,choice_2,correct_answer\n"line1\nline2",x,y,1'
    const result = await parseCsvFile(makeFile(csv, 'q.csv'))
    expect(result.length).toBeGreaterThanOrEqual(1)
  })

  it('handles a quoted cell that starts with a comma', async () => {
    const csv = 'question,choice_1,choice_2,correct_answer\n",starts with comma",x,y,1'
    const result = await parseCsvFile(makeFile(csv, 'q.csv'))
    expect(result[0].question).toBe(',starts with comma')
  })
})

describe('parseCsvFile — headers', () => {
  it('is case-insensitive on header names', async () => {
    const csv = 'Question,Choice_1,Choice_2,Correct_Answer\nQ1,a,b,1'
    const result = await parseCsvFile(makeFile(csv, 'q.csv'))
    expect(result).toHaveLength(1)
    expect(result[0].question).toBe('Q1')
    expect(result[0].correctAnswer).toBe(1)
  })

  it('returns an empty array for an empty file', async () => {
    const result = await parseCsvFile(makeFile('', 'empty.csv'))
    expect(result).toEqual([])
  })

  it('returns an empty array for a headers-only file', async () => {
    const result = await parseCsvFile(makeFile('question,choice_1,choice_2,correct_answer', 'q.csv'))
    expect(result).toEqual([])
  })

  it('defaults the correct answer to 1 when the cell is unparseable', async () => {
    const csv = 'question,choice_1,choice_2,correct_answer\nQ1,a,b,notanumber'
    const result = await parseCsvFile(makeFile(csv, 'q.csv'))
    expect(result[0].correctAnswer).toBe(1)
  })
})

describe('parseTelegramFile — explicit chosen answer', () => {
  it('uses the answer marked as `chosen` as the correct one', async () => {
    const data = {
      messages: [
        {
          poll: {
            question: 'Which?',
            answers: [
              { text: 'A', chosen: false, voters: 10 },
              { text: 'B', chosen: true, voters: 3 },
            ],
          },
        },
      ],
    }
    const result = await parseTelegramFile(makeFile(JSON.stringify(data), 'result.json'))
    expect(result).toHaveLength(1)
    expect(result[0].correctAnswer).toBe(2)
    expect(result[0].explanation).not.toMatch(/تخمين|guessed/i)
  })
})

describe('parseTelegramFile — guessed answer', () => {
  it('guesses from voter counts when no answer is marked chosen', async () => {
    const data = {
      messages: [
        {
          poll: {
            question: 'Which?',
            answers: [
              { text: 'A', chosen: false, voters: 1 },
              { text: 'B', chosen: false, voters: 20 },
              { text: 'C', chosen: false, voters: 5 },
            ],
          },
        },
      ],
    }
    const result = await parseTelegramFile(makeFile(JSON.stringify(data), 'result.json'))
    expect(result[0].correctAnswer).toBe(2)
  })

  it('marks the explanation as guessed when it had to infer', async () => {
    const data = {
      messages: [
        {
          poll: {
            question: 'Which?',
            answers: [
              { text: 'A', chosen: false, voters: 1 },
              { text: 'B', chosen: false, voters: 20 },
            ],
          },
        },
      ],
    }
    const result = await parseTelegramFile(makeFile(JSON.stringify(data), 'result.json'))
    expect(result[0].explanation).toMatch(/⚠️/)
  })
})

describe('parseTelegramFile — filtering', () => {
  it('ignores messages with no poll', async () => {
    const data = {
      messages: [
        { text: 'plain message' },
        {
          poll: {
            question: 'Q',
            answers: [
              { text: 'a', chosen: false, voters: 1 },
              { text: 'b', chosen: true, voters: 0 },
            ],
          },
        },
      ],
    }
    const result = await parseTelegramFile(makeFile(JSON.stringify(data), 'result.json'))
    expect(result).toHaveLength(1)
  })

  it('ignores polls with fewer than 2 answers', async () => {
    const data = {
      messages: [
        { poll: { question: 'Q', answers: [{ text: 'only', chosen: false, voters: 1 }] } },
      ],
    }
    const result = await parseTelegramFile(makeFile(JSON.stringify(data), 'result.json'))
    expect(result).toEqual([])
  })

  it('ignores polls with more than 8 answers', async () => {
    const data = {
      messages: [
        {
          poll: {
            question: 'Q',
            answers: Array.from({ length: 9 }, (_, i) => ({
              text: `a${i}`, chosen: false, voters: 1,
            })),
          },
        },
      ],
    }
    const result = await parseTelegramFile(makeFile(JSON.stringify(data), 'result.json'))
    expect(result).toEqual([])
  })

  it('returns an empty array when the top level is a non-object', async () => {

    const result = await parseTelegramFile(makeFile('[]', 'result.json'))
    expect(result).toEqual([])
  })
})
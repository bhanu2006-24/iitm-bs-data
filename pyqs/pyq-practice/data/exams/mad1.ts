
import { QuestionType } from '../../types';
import { createExamSet } from '../examUtils';

const TEMPLATES = [
  {
    text: (v: number) => `Which CSS selector has the highest specificity?`,
    sol: (v: number) => `ID selector (#) is stronger than Class (.) and Tag.`,
    type: QuestionType.MCQ,
    options: (v: number) => [
      { text: `#id`, isCorrect: true },
      { text: `.class` },
      { text: `div` },
      { text: `*` }
    ]
  },
  {
    text: (v: number) => `In JavaScript, what is the result of 'typeof []'?`,
    sol: (v: number) => `Arrays are objects in JS.`,
    type: QuestionType.MCQ,
    options: (v: number) => [
      { text: `'object'`, isCorrect: true },
      { text: `'array'` },
      { text: `'list'` },
      { text: `'undefined'` }
    ]
  },
  {
    text: (v: number) => `Which HTTP status code represents "Internal Server Error"?`,
    sol: (v: number) => `500 is Internal Server Error.`,
    type: QuestionType.NUMERIC,
    correctValue: (v: number) => 500,
  }
];

export const MAD1_EXAMS = createExamSet('mad1', TEMPLATES);
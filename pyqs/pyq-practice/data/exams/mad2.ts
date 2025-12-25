
import { QuestionType } from '../../types';
import { createExamSet } from '../examUtils';

const TEMPLATES = [
  {
    text: (v: number) => `In Vue.js, which directive is used for conditional rendering?`,
    sol: (v: number) => `v-if conditionally renders elements.`,
    type: QuestionType.MCQ,
    options: (v: number) => [
      { text: `v-if`, isCorrect: true },
      { text: `v-for` },
      { text: `v-bind` },
      { text: `v-on` }
    ]
  },
  {
    text: (v: number) => `What does SPA stand for in web development?`,
    sol: (v: number) => `Single Page Application.`,
    type: QuestionType.MCQ,
    options: (v: number) => [
      { text: `Single Page Application`, isCorrect: true },
      { text: `Simple Protocol Adapter` },
      { text: `Standard Port Access` },
      { text: `Server Process API` }
    ]
  },
  {
    text: (v: number) => `In a Fetch API call, which method parses the JSON response?`,
    sol: (v: number) => `.json() returns a promise that resolves with the result.`,
    type: QuestionType.MCQ,
    options: (v: number) => [
      { text: `.json()`, isCorrect: true },
      { text: `.parse()` },
      { text: `.text()` },
      { text: `.toString()` }
    ]
  }
];

export const MAD2_EXAMS = createExamSet('mad2', TEMPLATES);
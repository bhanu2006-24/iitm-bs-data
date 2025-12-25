
import { QuestionType } from '../../types';
import { createExamSet } from '../examUtils';

const TEMPLATES = [
  {
    text: (v: number) => `Consider relation R(A, B) and S(B, C). Which join returns all rows from R even if no match in S?`,
    sol: (v: number) => `Left Outer Join.`,
    type: QuestionType.MCQ,
    options: (v: number) => [
      { text: `Left Outer Join`, isCorrect: true },
      { text: `Inner Join` },
      { text: `Right Outer Join` },
      { text: `Cross Join` }
    ]
  },
  {
    text: (v: number) => `If a transaction ensures 'All or Nothing' execution, which ACID property is this?`,
    sol: (v: number) => `Atomicity.`,
    type: QuestionType.MCQ,
    options: (v: number) => [
      { text: `Atomicity`, isCorrect: true },
      { text: `Consistency` },
      { text: `Isolation` },
      { text: `Durability` }
    ]
  },
  {
    text: (v: number) => `Given table T with ${v} columns. What is the degree of the relation?`,
    sol: (v: number) => `Degree is the number of attributes (columns).`,
    type: QuestionType.NUMERIC,
    correctValue: (v: number) => v,
  }
];

export const DBMS_EXAMS = createExamSet('dbms', TEMPLATES);

import { QuestionType } from '../../types';
import { createExamSet } from '../examUtils';

const TEMPLATES = [
  {
    text: (v: number) => `What is the time complexity of Binary Search on a sorted array of size n?`,
    sol: (v: number) => `O(log n).`,
    type: QuestionType.MCQ,
    options: (v: number) => [
      { text: `O(log n)`, isCorrect: true },
      { text: `O(n)` },
      { text: `O(n log n)` },
      { text: `O(1)` }
    ]
  },
  {
    text: (v: number) => `In a Max-Heap with ${v} elements, where is the maximum element located?`,
    sol: (v: number) => `At the root.`,
    type: QuestionType.MCQ,
    options: (v: number) => [
      { text: `Root`, isCorrect: true },
      { text: `Last leaf` },
      { text: `Any leaf` },
      { text: `Random` }
    ]
  },
  {
    text: (v: number) => `How many edges are in a Minimum Spanning Tree of a connected graph with ${v} vertices?`,
    sol: (v: number) => `MST has V-1 edges.`,
    type: QuestionType.NUMERIC,
    correctValue: (v: number) => v - 1,
  }
];

export const PDSA_EXAMS = createExamSet('pdsa', TEMPLATES);
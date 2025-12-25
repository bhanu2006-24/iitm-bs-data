
import { QuestionType } from '../../types';
import { createExamSet } from '../examUtils';

const TEMPLATES = [
  {
    text: (v: number) => `In Minimax algorithm, the 'Max' player tries to:`,
    sol: (v: number) => `Maximize the utility value.`,
    type: QuestionType.MCQ,
    options: (v: number) => [
      { text: `Maximize utility`, isCorrect: true },
      { text: `Minimize utility` },
      { text: `Randomize move` },
      { text: `Pass turn` }
    ]
  },
  {
    text: (v: number) => `Is A* search complete?`,
    sol: (v: number) => `Yes, if the branching factor is finite and costs are positive.`,
    type: QuestionType.BOOLEAN,
    options: (v: number) => [
      { text: `True`, isCorrect: true },
      { text: `False` }
    ]
  }
];

export const AI_EXAMS = createExamSet('ai', TEMPLATES);
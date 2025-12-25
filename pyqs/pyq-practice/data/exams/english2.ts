
import { QuestionType } from '../../types';
import { createExamSet } from '../examUtils';

const TEMPLATES = [
  {
    text: (v: number) => `Identify the tone of this sentence: "I can't believe you did that again!"`,
    sol: (v: number) => `Exclamation indicates frustration or anger.`,
    type: QuestionType.MCQ,
    options: (v: number) => [
      { text: `Frustrated/Angry`, isCorrect: true },
      { text: `Happy` },
      { text: `Neutral` },
      { text: `Scientific` }
    ]
  },
  {
    text: (v: number) => `Select the correct connector: He studied hard, ___ he failed the test.`,
    sol: (v: number) => `Contrast requires 'yet' or 'but'.`,
    type: QuestionType.MCQ,
    options: (v: number) => [
      { text: `yet`, isCorrect: true },
      { text: `so` },
      { text: `because` },
      { text: `or` }
    ]
  }
];

export const ENG2_EXAMS = createExamSet('english2', TEMPLATES);
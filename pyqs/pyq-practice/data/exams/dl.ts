
import { QuestionType } from '../../types';
import { createExamSet } from '../examUtils';

const TEMPLATES = [
  {
    text: (v: number) => `In a neural network, what is the purpose of the loss function?`,
    sol: (v: number) => `Measures the difference between predicted and actual output.`,
    type: QuestionType.MCQ,
    options: (v: number) => [
      { text: `Measure error`, isCorrect: true },
      { text: `Update weights` },
      { text: `Activate neurons` },
      { text: `Initialize bias` }
    ]
  },
  {
    text: (v: number) => `Which optimizer uses adaptive learning rates?`,
    sol: (v: number) => `Adam (Adaptive Moment Estimation).`,
    type: QuestionType.MCQ,
    options: (v: number) => [
      { text: `Adam`, isCorrect: true },
      { text: `SGD` },
      { text: `GD` },
      { text: `Momentum` }
    ]
  }
];

export const DL_EXAMS = createExamSet('dl', TEMPLATES);

import { QuestionType } from '../../types';
import { createExamSet } from '../examUtils';

const TEMPLATES = [
  {
    text: (v: number) => `Why do we use Cross-Validation?`,
    sol: (v: number) => `To assess how the model generalizes to an independent dataset.`,
    type: QuestionType.MCQ,
    options: (v: number) => [
      { text: `Estimate generalization error`, isCorrect: true },
      { text: `Reduce training time` },
      { text: `Fit model faster` },
      { text: `Visualize data` }
    ]
  },
  {
    text: (v: number) => `Which transformer scales features to zero mean and unit variance?`,
    sol: (v: number) => `StandardScaler.`,
    type: QuestionType.MCQ,
    options: (v: number) => [
      { text: `StandardScaler`, isCorrect: true },
      { text: `MinMaxScaler` },
      { text: `RobustScaler` },
      { text: `Normalizer` }
    ]
  }
];

export const MLP_EXAMS = createExamSet('mlp', TEMPLATES);
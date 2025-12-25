
import { QuestionType } from '../../types';
import { createExamSet } from '../examUtils';

const TEMPLATES = [
  {
    text: (v: number) => `In Pandas, which method fills missing values?`,
    sol: (v: number) => `fillna().`,
    type: QuestionType.MCQ,
    options: (v: number) => [
      { text: `fillna()`, isCorrect: true },
      { text: `dropna()` },
      { text: `isna()` },
      { text: `replace()` }
    ]
  },
  {
    text: (v: number) => `Which library provides the 'DataFrame' structure?`,
    sol: (v: number) => `Pandas.`,
    type: QuestionType.MCQ,
    options: (v: number) => [
      { text: `Pandas`, isCorrect: true },
      { text: `NumPy` },
      { text: `Matplotlib` },
      { text: `SciPy` }
    ]
  }
];

export const TDS_EXAMS = createExamSet('tds', TEMPLATES);

import { QuestionType } from '../../types';
import { createExamSet } from '../examUtils';

const TEMPLATES = [
  {
    text: (v: number) => `In A/B testing, what is the 'Control' group?`,
    sol: (v: number) => `The group that receives the standard version (baseline).`,
    type: QuestionType.MCQ,
    options: (v: number) => [
      { text: `Baseline group`, isCorrect: true },
      { text: `Experimental group` },
      { text: `Outlier group` },
      { text: `Null group` }
    ]
  },
  {
    text: (v: number) => `Which type of analytics answers "Why did it happen?"`,
    sol: (v: number) => `Diagnostic analytics.`,
    type: QuestionType.MCQ,
    options: (v: number) => [
      { text: `Diagnostic`, isCorrect: true },
      { text: `Descriptive` },
      { text: `Predictive` },
      { text: `Prescriptive` }
    ]
  }
];

export const BA_EXAMS = createExamSet('ba', TEMPLATES);
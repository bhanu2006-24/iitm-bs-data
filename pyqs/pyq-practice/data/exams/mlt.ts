
import { QuestionType } from '../../types';
import { createExamSet } from '../examUtils';

const TEMPLATES = [
  {
    text: (v: number) => `In K-Means, the algorithm stops when:`,
    sol: (v: number) => `Centroids do not change (convergence).`,
    type: QuestionType.MCQ,
    options: (v: number) => [
      { text: `Centroids do not change`, isCorrect: true },
      { text: `K increases` },
      { text: `Data points are removed` },
      { text: `None` }
    ]
  },
  {
    text: (v: number) => `What is the role of the Kernel in SVM?`,
    sol: (v: number) => `Transforms data to higher dimension to make it linearly separable.`,
    type: QuestionType.MCQ,
    options: (v: number) => [
      { text: `Map to higher dimensions`, isCorrect: true },
      { text: `Reduce dimensions` },
      { text: `Calculate probability` },
      { text: `Cluster data` }
    ]
  },
  {
    text: (v: number) => `In a Random Forest with ${v} trees, how is the final classification made?`,
    sol: (v: number) => `Majority voting.`,
    type: QuestionType.MCQ,
    options: (v: number) => [
      { text: `Majority Voting`, isCorrect: true },
      { text: `Average of probabilities` },
      { text: `Tree with max depth` },
      { text: `Tree with min error` }
    ]
  }
];

export const MLT_EXAMS = createExamSet('mlt', TEMPLATES);
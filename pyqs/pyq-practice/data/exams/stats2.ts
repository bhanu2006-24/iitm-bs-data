
import { QuestionType } from '../../types';
import { createExamSet } from '../examUtils';

const TEMPLATES = [
  {
    text: (v: number) => `A sample of size ${v*10} has mean 50 and std dev 5. Calculate the standard error of the mean.`,
    sol: (v: number) => `SE = $\\frac{\\sigma}{\\sqrt{n}} = \\frac{5}{\\sqrt{${v*10}}}$.`,
    type: QuestionType.NUMERIC,
    correctValue: (v: number) => parseFloat((5 / Math.sqrt(v*10)).toFixed(3)),
  },
  {
    text: (v: number) => `In a Z-test, if the test statistic is ${v/2} and the critical value is 1.96 (two-tailed), do we reject null hypothesis?`,
    sol: (v: number) => `|${v/2}| ${v/2 > 1.96 ? '>' : '<'} 1.96.`,
    type: QuestionType.BOOLEAN,
    options: (v: number) => [
      { text: `Reject Null Hypothesis`, isCorrect: (v/2 > 1.96) },
      { text: `Fail to Reject Null Hypothesis`, isCorrect: (v/2 <= 1.96) }
    ]
  },
  {
    text: (v: number) => `Which distribution is used when population variance is unknown and sample size is small (<30)?`,
    sol: (v: number) => `Student's t-distribution.`,
    type: QuestionType.MCQ,
    options: (v: number) => [
      { text: `t-distribution`, isCorrect: true },
      { text: `Z-distribution` },
      { text: `Chi-square` },
      { text: `F-distribution` }
    ]
  },
  {
    text: (v: number) => `Type I error occurs when:`,
    sol: (v: number) => `We reject a true null hypothesis.`,
    type: QuestionType.MCQ,
    options: (v: number) => [
      { text: `We reject H0 when it is true`, isCorrect: true },
      { text: `We fail to reject H0 when it is false` },
      { text: `We reject H0 when it is false` },
      { text: `We accept H0 when it is true` }
    ]
  }
];

export const STATS2_EXAMS = createExamSet('stats2', TEMPLATES);
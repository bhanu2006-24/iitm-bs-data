
import { QuestionType } from '../../types';
import { createExamSet } from '../examUtils';

const TEMPLATES = [
  {
    text: (v: number) => `In how many ways can ${v} distinct books be arranged on a shelf?`,
    sol: (v: number) => `${v}! ways.`,
    type: QuestionType.NUMERIC,
    correctValue: (v: number) => {
        let f = 1; for(let i=1; i<=v; i++) f*=i; return f;
    }
  },
  {
    text: (v: number) => `Given $P(A) = 0.4, P(B) = 0.${v}$, and $A, B$ are mutually exclusive. Find $P(A \\cup B)$.`,
    sol: (v: number) => `Sum of probabilities: $0.4 + 0.${v}$.`,
    type: QuestionType.NUMERIC,
    correctValue: (v: number) => parseFloat((0.4 + v/10).toFixed(1)),
  },
  {
    text: (v: number) => `A fair die is rolled ${v} times. What is the expected sum of the numbers?`,
    sol: (v: number) => `E[X] for one roll is 3.5. For ${v} rolls: $3.5 \\times ${v}$.`,
    type: QuestionType.NUMERIC,
    correctValue: (v: number) => 3.5 * v,
  },
  {
    text: (v: number) => `If a random variable X follows a discrete uniform distribution on $\\{1, 2, ..., ${v}\\}$, what is $P(X \\ge 2)$?`,
    sol: (v: number) => `Total ${v} outcomes. Fav: $2, ..., ${v}$ (${v-1} outcomes). Prob = $\\frac{${v-1}}{${v}}$.`,
    type: QuestionType.NUMERIC,
    correctValue: (v: number) => (v-1)/v,
  }
];

export const STATS1_EXAMS = createExamSet('stats1', TEMPLATES);
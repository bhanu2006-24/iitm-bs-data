
import { QuestionType } from '../../types';
import { createExamSet } from '../examUtils';

const TEMPLATES = [
  {
    text: (v: number) => `A dataset contains ${v*100} cards. You split it into piles based on 'Suit'. How many piles do you have?`,
    sol: (v: number) => `A standard deck has 4 suits (Hearts, Diamonds, Clubs, Spades).`,
    type: QuestionType.NUMERIC,
    correctValue: (v: number) => 4,
  },
  {
    text: (v: number) => `Follow the procedure:
    1. Start with X = ${v}.
    2. If X is even, divide by 2.
    3. If X is odd, add 1.
    4. Repeat step 2 or 3 once more.
    What is the final value?`,
    sol: (v: number) => {
        let x = v;
        x = (x%2===0) ? x/2 : x+1;
        x = (x%2===0) ? x/2 : x+1;
        return `After two steps, value is ${x}.`;
    },
    type: QuestionType.NUMERIC,
    correctValue: (v: number) => {
        let x = v;
        x = (x%2===0) ? x/2 : x+1;
        x = (x%2===0) ? x/2 : x+1;
        return x;
    }
  },
  {
    text: (v: number) => `Which iteration logic best describes: "Process every student in a class"?`,
    sol: (v: number) => `For-each loop or iterating through a list.`,
    type: QuestionType.MCQ,
    options: (v: number) => [
      { text: `Iterator / For-each`, isCorrect: true },
      { text: `Infinite While Loop` },
      { text: `Conditional If-Else` },
      { text: `Binary Search` }
    ]
  }
];

export const CT_EXAMS = createExamSet('ct', TEMPLATES);

import { QuestionType } from '../../types';
import { createExamSet } from '../examUtils';

const TEMPLATES = [
  {
    text: (v: number) => `Which concept of OOP is demonstrated by exposing only necessary details and hiding internal implementation?`,
    sol: (v: number) => `Encapsulation / Abstraction.`,
    type: QuestionType.MCQ,
    options: (v: number) => [
      { text: `Encapsulation`, isCorrect: true },
      { text: `Polymorphism` },
      { text: `Inheritance` },
      { text: `Overloading` }
    ]
  },
  {
    text: (v: number) => `What is the output of: String s = "Java" + ${v} + ${v}; System.out.println(s);`,
    sol: (v: number) => `String concatenation happens left to right. "Java" + ${v} becomes "Java${v}", then "Java${v}" + ${v} becomes "Java${v}${v}".`,
    type: QuestionType.MCQ,
    options: (v: number) => [
      { text: `Java${v}${v}`, isCorrect: true },
      { text: `Java${v+v}` },
      { text: `Error` },
      { text: `Java ${v+v}` }
    ]
  },
  {
    text: (v: number) => `Which collection does not allow duplicate elements?`,
    sol: (v: number) => `Set interface does not allow duplicates.`,
    type: QuestionType.MCQ,
    options: (v: number) => [
      { text: `Set`, isCorrect: true },
      { text: `List` },
      { text: `Map` }, // Map keys are unique but Map itself is key-value
      { text: `Array` }
    ]
  }
];

export const JAVA_EXAMS = createExamSet('java', TEMPLATES);
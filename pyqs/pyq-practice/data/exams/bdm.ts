
import { QuestionType } from '../../types';
import { createExamSet } from '../examUtils';

const TEMPLATES = [
  {
    text: (v: number) => `Which component of Hadoop is responsible for resource management?`,
    sol: (v: number) => `YARN (Yet Another Resource Negotiator).`,
    type: QuestionType.MCQ,
    options: (v: number) => [
      { text: `YARN`, isCorrect: true },
      { text: `HDFS` },
      { text: `MapReduce` },
      { text: `Hive` }
    ]
  },
  {
    text: (v: number) => `What does 'Velocity' refer to in Big Data?`,
    sol: (v: number) => `Speed at which data is generated.`,
    type: QuestionType.MCQ,
    options: (v: number) => [
      { text: `Speed of generation`, isCorrect: true },
      { text: `Size of data` },
      { text: `Trustworthiness` },
      { text: `Format variety` }
    ]
  }
];

export const BDM_EXAMS = createExamSet('bdm', TEMPLATES);
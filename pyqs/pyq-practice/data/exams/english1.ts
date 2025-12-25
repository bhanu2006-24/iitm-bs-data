
import { ExamPaper, ExamType, QuestionType } from '../../types';
import { createExamSet } from '../examUtils';

// ============================================================================
// 1. AUTOMATIC TEMPLATES
// ============================================================================
const PASSAGE = `
Climate change is a long-term shift in global or regional climate patterns. 
Often climate change refers specifically to the rise in global temperatures from the mid-20th century to present.
`;

const TEMPLATES = [
  {
    context: (v: number) => PASSAGE,
    text: (v: number) => `According to the passage, climate change refers to shifts in:`,
    sol: (v: number) => `Global or regional patterns.`,
    type: QuestionType.MCQ,
    options: (v: number) => [
      { text: `Global or regional climate patterns`, isCorrect: true },
      { text: `Only weather in the US` },
      { text: `Daily temperature changes` },
      { text: `Stock market fluctuations` }
    ]
  },
  {
    text: (v: number) => `Choose the correct verb form: She ___ to the market yesterday.`,
    sol: (v: number) => `Past tense of 'go' is 'went'.`,
    type: QuestionType.MCQ,
    options: (v: number) => [
      { text: `went`, isCorrect: true },
      { text: `go` },
      { text: `gone` },
      { text: `goes` }
    ]
  }
];

const generatedPapers = createExamSet('english1', TEMPLATES);

// ============================================================================
// 2. REAL STATIC PAPER (Example: Week 1 Assignment)
// ============================================================================
const REAL_PAPER_ENG: ExamPaper = {
  id: 'eng1-real-2023-w1',
  title: 'Graded Assignment 1 (Real)',
  subjectId: 'english1',
  examType: ExamType.QUIZ_1,
  year: '2023',
  set: 'Week 1',
  durationMinutes: 30,
  totalMarks: 20,
  questions: [
      {
          id: 'eng-q1',
          subjectId: 'english1',
          type: QuestionType.MCQ,
          marks: 2,
          text: "Identify the part of speech for the capitalized word: She walked SLOWLY.",
          options: [
              { id: 'a', text: 'Noun', isCorrect: false },
              { id: 'b', text: 'Verb', isCorrect: false },
              { id: 'c', text: 'Adjective', isCorrect: false },
              { id: 'd', text: 'Adverb', isCorrect: true }
          ],
          solutionExplanation: "Slowly modifies the verb 'walked', so it is an Adverb."
      },
      {
          id: 'eng-q2',
          subjectId: 'english1',
          type: QuestionType.MCQ,
          marks: 2,
          text: "Choose the correct sentence:",
          options: [
              { id: 'a', text: "He don't like coffee.", isCorrect: false },
              { id: 'b', text: "He doesn't likes coffee.", isCorrect: false },
              { id: 'c', text: "He doesn't like coffee.", isCorrect: true },
              { id: 'd', text: "He don't likes coffee.", isCorrect: false }
          ],
          solutionExplanation: "Third person singular 'He' takes 'does not' and the base verb 'like'."
      }
  ]
}

export const ENG1_EXAMS = [...generatedPapers, REAL_PAPER_ENG];

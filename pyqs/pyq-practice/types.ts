
export enum QuestionType {
  MCQ = 'MCQ',         // Multiple Choice (Radio)
  MSQ = 'MSQ',         // Multiple Select (Checkbox)
  NUMERIC = 'NUMERIC', // Numeric Input
  BOOLEAN = 'BOOLEAN', // True/False
  TEXT = 'TEXT'        // Short Answer
}

export enum Level {
  FOUNDATION = 'Foundation Level',
  DIPLOMA_PROG = 'Diploma in Programming',
  DIPLOMA_DS = 'Diploma in Data Science',
  DEGREE = 'Degree Level'
}

export enum ExamType {
  QUIZ_1 = 'Quiz 1',
  QUIZ_2 = 'Quiz 2',
  END_TERM = 'End Term',
  OPPE = 'OPPE'
}

export interface QuestionOption {
  id: string;
  text: string; // HTML allowed
  imgUrl?: string; // Optional image for the option (e.g., graph matching)
  isCorrect?: boolean;
}

export interface Question {
  id: string;
  type: QuestionType;
  text: string; // Main question HTML
  imgUrl?: string; // Main question image
  context?: string; // Passage/Comprehension HTML
  codeSnippet?: string; // For programming questions
  options?: QuestionOption[]; 
  correctValue?: number | string; // For Numeric/Text
  range?: { min: number; max: number }; // For Numeric range
  solutionExplanation?: string; // HTML
  marks: number;
  negativeMarks?: number; // Added support for negative marking
  subjectId?: string; // Added to match data files usage
}

export interface ExamPaper {
  id: string;
  title: string;
  subjectId: string;
  examType: ExamType;
  year: string;
  set: string;
  questions: Question[];
  durationMinutes: number;
  totalMarks: number;
}

export interface Subject {
  id: string;
  name: string;
  level: Level;
  code: string;
}

export interface Attempt {
  examId: string;
  examTitle: string;
  score: number;
  totalMarks: number;
  date: string;
  timeSpentSeconds: number;
}

import { ExamPaper, ExamType, QuestionType } from '../../types';
import { createExamSet } from '../examUtils';

// ============================================================================
// 1. AUTOMATIC TEMPLATES
// ============================================================================
const TEMPLATES = [
  {
    text: (v: number) => `What is the output of the following code?`,
    codeSnippet: (v: number) => `L = [1, 2, 3, 4, 5]\nprint(L[${v%3}:${v%3+2}])`,
    sol: (v: number) => `Slicing from index ${v%3} to ${v%3+2} (exclusive).`,
    type: QuestionType.MCQ,
    options: (v: number) => {
        const start = v%3;
        const L = [1, 2, 3, 4, 5];
        const res = L.slice(start, start+2);
        return [
            { text: `[${res.join(', ')}]`, isCorrect: true },
            { text: `[${L[start]}]` },
            { text: `[${L.slice(start, start+3).join(', ')}]` },
            { text: `Error` }
        ]
    }
  },
  {
    text: (v: number) => `Which of the following is immutable in Python?`,
    sol: (v: number) => `Tuples and strings are immutable. Lists and dictionaries are mutable.`,
    type: QuestionType.MCQ,
    options: (v: number) => [
      { text: `Tuple`, isCorrect: true },
      { text: `List` },
      { text: `Dictionary` },
      { text: `Set` }
    ]
  },
  {
    text: (v: number) => `How many times will 'Hello' be printed?`,
    codeSnippet: (v: number) => `i = 0\nwhile i < ${v}:\n    print('Hello')\n    i += 2`,
    sol: (v: number) => `Loop runs for 0, 2, 4... up to < ${v}. Count is ceil(${v}/2).`,
    type: QuestionType.NUMERIC,
    correctValue: (v: number) => Math.ceil(v/2),
  }
];

const generatedPapers = createExamSet('python', TEMPLATES);

// ============================================================================
// 2. REAL STATIC PAPER (Based on PDF Input)
// ============================================================================
const REAL_PAPER_PYTHON: ExamPaper = {
  id: 'python-real-2022-et',
  title: 'End Term - 2022 (Real)',
  subjectId: 'python',
  examType: ExamType.END_TERM,
  year: '2022',
  set: 'Set A',
  durationMinutes: 120,
  totalMarks: 100,
  questions: [
    {
      id: 'py-q67',
      subjectId: 'python',
      type: QuestionType.MCQ,
      marks: 3,
      text: "What is the output of the following snippet of code?",
      codeSnippet: `def welcome(age):\n    if 0 < age < 18:\n        print('welcome boys and girls')\n    else:\n        print('welcome ladies and gentlemen')\n\nprint(welcome(50))`,
      options: [
        { id: 'opt1', text: "welcome boys and girls", isCorrect: false },
        { id: 'opt2', text: "welcome ladies and gentlemen", isCorrect: false },
        { id: 'opt3', text: "welcome ladies and gentlemen<br/>None", isCorrect: true },
        { id: 'opt4', text: "None", isCorrect: false }
      ],
      solutionExplanation: "The function prints 'welcome ladies and gentlemen' for age 50. Since it has no return statement, it returns None, which is then printed by the outer print()."
    },
    {
      id: 'py-q70',
      subjectId: 'python',
      type: QuestionType.MCQ,
      marks: 3,
      text: "What will be the output of the following Python code?",
      codeSnippet: `string1 = 'programming'\nstring2 = 'python'\nL = []\nfor i in range(0, len(string1)):\n    for j in range(0, len(string2)):\n        if string1[i] == string2[j]:\n            L.append(string1[i])\n            break\n    else:\n        continue\nprint(L)`,
      options: [
        { id: 'opt1', text: "['p', 'o', 'n', 'p', 'o', 'n']", isCorrect: false },
        { id: 'opt2', text: "['p', 'r', 'o', 'n']", isCorrect: false },
        { id: 'opt3', text: "['p', 'o', 'n']", isCorrect: true }, 
        { id: 'opt4', text: "None of these", isCorrect: false }
      ],
      solutionExplanation: "The code finds characters in 'programming' that are also in 'python'. 'p' matches. 'r' not in python. 'o' matches. 'g' no. 'r' no. 'a' no. 'm' no. 'm' no. 'i' no. 'n' matches. 'g' no. Result: p, o, n."
    },
    {
      id: 'py-q71',
      subjectId: 'python',
      type: QuestionType.MCQ,
      marks: 3,
      text: "Consider the following recursive function. If L is a non-empty list of positive integers, what does it calculate?",
      codeSnippet: `def func(L):\n    if L == []:\n        return 0\n    if L[-1] % 2 == 1:\n        return L[-1] + func(L[:-1])\n    else:\n        return func(L[:-1])`,
      options: [
        { id: 'opt1', text: "It returns total number of odd elements in the list L", isCorrect: false },
        { id: 'opt2', text: "It returns total number of even elements in the list L", isCorrect: false },
        { id: 'opt3', text: "It returns sum of the even elements in the list L", isCorrect: false },
        { id: 'opt4', text: "It returns sum of the odd elements in the list L", isCorrect: true }
      ],
      solutionExplanation: "The function adds the last element to the result if it's odd, otherwise skips it, processing the rest of the list recursively."
    },
    {
      id: 'py-q72',
      subjectId: 'python',
      type: QuestionType.MCQ,
      marks: 3,
      text: "What will be the output of the following Python code?",
      codeSnippet: `A = [[2, 2, 3], [3, 4, 5], [1, 0, 7]]\nB = [[1, 1, 4], [4, 5, 2], [1, 4, 1]]\n# code to compute C = B - A\nfor i in range(n):\n    for j in range(n):\n        C[i][j] = B[i][j] - A[i][j]\n# code prints diagonal of C`,
      options: [
        { id: 'opt1', text: "3, 3, -7", isCorrect: false },
        { id: 'opt2', text: "-1, -1, 1", isCorrect: false },
        { id: 'opt3', text: "-1, -1, 1, 1, -3", isCorrect: false },
        { id: 'opt4', text: "-1, 1, -6", isCorrect: true }
      ],
      solutionExplanation: "Diagonal of B-A: (1-2), (5-4), (1-7) => -1, 1, -6."
    },
    {
      id: 'py-q73',
      subjectId: 'python',
      type: QuestionType.MCQ,
      marks: 4,
      text: "Select the correct implementation of a program that creates a text file named pattern.txt and writes to it.",
      options: [
        { id: 'opt1', text: "f = open('pattern.txt', 'r')", isCorrect: false },
        { id: 'opt2', text: "f = open('pattern.txt', 'w')", isCorrect: true },
        { id: 'opt3', text: "f = open('pattern.txt', 'rb')", isCorrect: false },
        { id: 'opt4', text: "None", isCorrect: false }
      ],
      solutionExplanation: "Mode 'w' is required to create and write to a file."
    },
    {
      id: 'py-q79',
      subjectId: 'python',
      type: QuestionType.MSQ,
      marks: 3,
      text: "The variable s is a set in which of the following options?",
      options: [
        { id: 'opt1', text: "s = set()", isCorrect: true },
        { id: 'opt2', text: "s = {}", isCorrect: false }, // Dictionary
        { id: 'opt3', text: "s = {1, 2, 3}", isCorrect: true },
        { id: 'opt4', text: "s = set([1, 2, 3])", isCorrect: true }
      ],
      solutionExplanation: "{} creates an empty dictionary. set() creates an empty set. {1,2,3} is a set literal."
    },
    {
      id: 'py-q85',
      subjectId: 'python',
      type: QuestionType.MSQ,
      marks: 5,
      text: "We are not sure if the file file.txt exists. Select all correct implementations that handle this gracefully.",
      codeSnippet: `try:\n    f = open('file.txt', 'r')\nexcept...`,
      options: [
        { id: 'opt1', text: "except FileNotFoundError:", isCorrect: true },
        { id: 'opt2', text: "except:", isCorrect: true },
        { id: 'opt3', text: "except ValueError:", isCorrect: false },
        { id: 'opt4', text: "No try-except", isCorrect: false }
      ],
      solutionExplanation: "FileNotFoundError is the specific exception. A bare 'except' also catches it but is less precise."
    },
    {
      id: 'py-q-comp',
      subjectId: 'python',
      type: QuestionType.MCQ,
      marks: 4,
      context: `Consider the following snippet of code:
      <pre>M = [[0 for j in range(3)] for i in range(3)]</pre>`,
      text: "Select the snippet of code that is equivalent to this.",
      codeSnippet: `M = []\nfor i in range(3):\n    M.append([])\n    for j in range(3):\n        M[-1].append(0)`,
      options: [
          { id: 'opt1', text: "The code snippet above", isCorrect: true },
          { id: 'opt2', text: "Incorrect loop structure", isCorrect: false }
      ]
    },
    {
        id: 'py-q94',
        subjectId: 'python',
        type: QuestionType.MCQ,
        marks: 4,
        text: "What is the output of the following snippet of code?",
        codeSnippet: `x = Rational(15, 24)\nx.divide(5)\nx.print_info()`,
        options: [
            { id: 'a', text: '3/24', isCorrect: false },
            { id: 'b', text: '1/8', isCorrect: true },
            { id: 'c', text: '15/24', isCorrect: false },
            { id: 'd', text: '5/24', isCorrect: false }
        ],
        solutionExplanation: "Rational(15, 24) likely simplifies to 5/8 (gcd is 3). divide(5) divides the numerator, making it 1/8."
    }
  ]
};

export const PYTHON_EXAMS = [...generatedPapers, REAL_PAPER_PYTHON];

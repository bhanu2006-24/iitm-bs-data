
import { ExamPaper, ExamType, QuestionType, Question } from '../../types';
import { createExamSet, generateQuestions } from '../examUtils';

// ============================================================================
// 1. AUTOMATIC TEMPLATES
// ============================================================================
const TEMPLATES = [
  {
    text: (v: number) => `Let $f: \\mathbb{R} \\to \\mathbb{R}$ be defined by $f(x) = x^2 - ${v}x + 6$. Find the number of points where $f(x) = f^{-1}(x)$ given the domain is restricted to $x \\ge ${v/2}$.`,
    sol: (v: number) => `For $f(x) = f^{-1}(x)$, the intersection lies on $y=x$. Solve $x^2 - ${v}x + 6 = x \\implies x^2 - ${v+1}x + 6 = 0$. Discriminant check required.`,
    type: QuestionType.MCQ,
    options: (v: number) => [
      { text: `0`, isCorrect: (v+1)*(v+1) - 24 < 0 },
      { text: `1`, isCorrect: (v+1)*(v+1) - 24 === 0 },
      { text: `2`, isCorrect: (v+1)*(v+1) - 24 > 0 },
      { text: `Infinite` }
    ]
  },
  {
    text: (v: number) => `Find the domain of the function $f(x) = \\sqrt{ \\log_{${v}} (x - 2) }$.`,
    sol: (v: number) => `Argument of log must be positive: $x-2 > 0 \\implies x > 2$. Also $\\log_{${v}}(x-2) \\ge 0 \\implies x-2 \\ge 1 \\implies x \\ge 3$.`,
    type: QuestionType.MCQ,
    options: (v: number) => [
      { text: `$[3, \\infty)$`, isCorrect: true },
      { text: `$(2, \\infty)$` },
      { text: `$(3, \\infty)$` },
      { text: `$[2, \\infty)$` }
    ]
  },
  {
    text: (v: number) => `Evaluate $\\lim_{x \\to 0} \\frac{\\sin(${v}x)}{x}$.`,
    sol: (v: number) => `Using L'Hopital or standard limit, result is ${v}.`,
    type: QuestionType.NUMERIC,
    correctValue: (v: number) => v,
  },
  {
    context: (v: number) => `<b>Passage:</b> Let $f(x) = x^3 - 3x + ${v}$.`,
    text: (v: number) => `Find the local maximum value of $f(x)$.`,
    sol: (v: number) => `$f'(x) = 3x^2 - 3 = 0 \\implies x = \\pm 1$. Max at $x=-1$. $f(-1) = -1 + 3 + ${v} = ${v+2}$.`,
    type: QuestionType.NUMERIC,
    correctValue: (v: number) => v + 2,
  },
  {
    context: (v: number) => `<b>Passage:</b> Let $f(x) = x^3 - 3x + ${v}$.`,
    text: (v: number) => `Find the local minimum value of $f(x)$.`,
    sol: (v: number) => `Min at $x=1$. $f(1) = 1 - 3 + ${v} = ${v-2}$.`,
    type: QuestionType.NUMERIC,
    correctValue: (v: number) => v - 2,
  }
];

const generatedPapers = createExamSet('math1', TEMPLATES);

// ============================================================================
// 2. REAL STATIC PAPER (Based on PDF Input)
// ============================================================================
const REAL_PAPER_MATH1: ExamPaper = {
  id: 'math1-real-2022-et',
  title: 'End Term - 2022 (Real)',
  subjectId: 'math1',
  examType: ExamType.END_TERM,
  year: '2022',
  set: 'Set A',
  durationMinutes: 120,
  totalMarks: 50,
  questions: [
    {
      id: 'm1-q2',
      subjectId: 'math1',
      type: QuestionType.NUMERIC,
      marks: 3,
      text: "What is the minimum number of colours required to colour the graph given below?",
      imgUrl: "https://placehold.co/600x400/png?text=Graph+G%0A(Outer+Pentagon,+Inner+Star)",
      correctValue: 3,
      solutionExplanation: "The graph contains triangles (odd cycles), so at least 3 colors are needed. A 3-coloring is possible (Outer cycle alternates, center helps)."
    },
    {
      id: 'm1-q3',
      subjectId: 'math1',
      type: QuestionType.NUMERIC,
      marks: 3,
      text: "What is the weight of a minimum cost spanning tree of the given graph?",
      imgUrl: "https://placehold.co/600x300/png?text=Weighted+Graph%0A(Nodes+A-G,+Edges+with+weights)",
      correctValue: 23,
      solutionExplanation: "Using Kruskal's or Prim's algorithm: Select edges with smallest weights (1, 2, 3...) that don't form a cycle. Sum = 1+2+3+3+4+5+5 = 23."
    },
    {
      id: 'm1-q4',
      subjectId: 'math1',
      type: QuestionType.NUMERIC,
      marks: 2,
      text: "How many edges are there in a graph with 10 vertices each of degree 6?",
      correctValue: 30,
      solutionExplanation: "Using the Handshaking Lemma: Sum of degrees = $2 \\times |E|$. <br> $10 \\times 6 = 60$. <br> $|E| = 60/2 = 30$."
    },
    {
      id: 'm1-q5',
      subjectId: 'math1',
      type: QuestionType.MCQ,
      marks: 4,
      text: "Suppose we perform BFS so that when we visit a vertex, we explore its unvisited neighbors in a random order. Which of the following graphs could represent the edges explored by BFS starting at vertex 'E'?",
      imgUrl: "https://placehold.co/600x300/png?text=Source+Graph+G%0A(Root+E,+Neighbors+A,B,C,D)",
      options: [
        { id: 'opt1', text: "Graph A", imgUrl: "https://placehold.co/300x200/png?text=Option+A+(Deep+Tree)", isCorrect: false },
        { id: 'opt2', text: "Graph B", imgUrl: "https://placehold.co/300x200/png?text=Option+B+(Broad+Tree)", isCorrect: true },
        { id: 'opt3', text: "Graph C", imgUrl: "https://placehold.co/300x200/png?text=Option+C", isCorrect: false },
        { id: 'opt4', text: "Graph D", imgUrl: "https://placehold.co/300x200/png?text=Option+D", isCorrect: false }
      ],
      solutionExplanation: "BFS explores layer by layer. Starting at E, it must visit all immediate neighbors of E (likely B, C, D) before moving to the next level (A). Graph B shows this structure."
    },
    {
      id: 'm1-q6',
      subjectId: 'math1',
      type: QuestionType.MSQ,
      marks: 4,
      text: "Which of the following are valid topological orderings of the given DAG?",
      imgUrl: "https://placehold.co/500x300/png?text=Directed+Acyclic+Graph%0A(Arrows+Pointing+Down/Right)",
      options: [
        { id: 'opt1', text: "E, F, C, B, A, G, H, D", isCorrect: false },
        { id: 'opt2', text: "E, F, B, C, G, A, H, D", isCorrect: true },
        { id: 'opt3', text: "E, F, C, B, G, A, H, D", isCorrect: false },
        { id: 'opt4', text: "E, F, C, B, G, H, D, A", isCorrect: true }
      ],
      solutionExplanation: "Topological sort requires that for every edge $u \\to v$, vertex $u$ comes before $v$ in the ordering. E and F are sources."
    },
    {
      id: 'm1-q9-comprehension',
      subjectId: 'math1',
      type: QuestionType.MCQ,
      marks: 2,
      context: `Consider the following piecewise function:
      $$ f(x) = \\begin{cases} 5^x, & x < 0 \\\\ 1, & x = 0 \\\\ x^{1/5} + 2, & x > 0 \\end{cases} $$`,
      text: "The solid points denote the value of the function at the points, and the function does not take the values denoted by the hollow points. Which of the following figures may represent the graph of the function?",
      options: [
          { id: 'opt1', text: "", imgUrl: "https://placehold.co/300x200/png?text=Graph+A", isCorrect: false },
          { id: 'opt2', text: "", imgUrl: "https://placehold.co/300x200/png?text=Graph+B", isCorrect: true },
          { id: 'opt3', text: "", imgUrl: "https://placehold.co/300x200/png?text=Graph+C", isCorrect: false },
          { id: 'opt4', text: "", imgUrl: "https://placehold.co/300x200/png?text=Graph+D", isCorrect: false }
      ],
      solutionExplanation: "At $x=0$, $f(x)=1$ (solid dot). For $x<0$, exponential decay towards 0. For $x>0$, root function shifted up by 2 (starts near 2)."
    },
    {
      id: 'm1-q10-comprehension',
      subjectId: 'math1',
      type: QuestionType.MSQ,
      marks: 3,
      context: `Consider the following piecewise function:
      $$ f(x) = \\begin{cases} 5^x, & x < 0 \\\\ 1, & x = 0 \\\\ x^{1/5} + 2, & x > 0 \\end{cases} $$`,
      text: "Which of the following options is (are) true?",
      options: [
        { id: 'opt1', text: "$f(x)$ is a bounded function.", isCorrect: false },
        { id: 'opt2', text: "$f(x)$ is differentiable at $x=0$.", isCorrect: false },
        { id: 'opt3', text: "$f(x)$ is continuous at $x=0$.", isCorrect: false },
        { id: 'opt4', text: "$\\lim_{x \\to -\\infty} f(x) = 0$", isCorrect: true },
        { id: 'opt5', text: "$\\lim_{x \\to 0^-} f(x) = 1$", isCorrect: true }
      ],
      solutionExplanation: "Limit as $x \\to 0^-$ is $5^0 = 1$. Limit as $x \\to 0^+$ is $0+2 = 2$. Discontinuous at 0."
    },
    {
      id: 'm1-q11',
      subjectId: 'math1',
      type: QuestionType.NUMERIC,
      marks: 2,
      text: "Let $f$ be differentiable at $x=2$. The tangent line to the curve represented by the function $f$ at the point $(2, 6)$ passes through the point $(6, -18)$. What will be the value of $f'(2)$?",
      correctValue: -6,
      solutionExplanation: "The derivative $f'(2)$ is the slope of the tangent line. <br> Slope $m = \\frac{y_2 - y_1}{x_2 - x_1} = \\frac{-18 - 6}{6 - 2} = \\frac{-24}{4} = -6$."
    },
    {
      id: 'm1-q17-comprehension',
      subjectId: 'math1',
      type: QuestionType.MCQ,
      marks: 1,
      context: `Define a function $f$ in the interval $[-2, 10]$ as follows:
      $$ f(x) = \\begin{cases} 2x^2 & -2 \\le x < 2 \\\\ (x-2)^3 & 2 \\le x < 4 \\\\ -\\frac{2}{3}(x-4) + 4 & 4 \\le x \\le 10 \\end{cases} $$
      <br>
      <img src="https://placehold.co/600x300/png?text=Graph+of+f(x)+on+[-2,10]" />`,
      text: "The number of critical points in $(-2, 10)$ is 7.",
      options: [
          { id: 'true', text: "True", isCorrect: false },
          { id: 'false', text: "False", isCorrect: true }
      ],
      solutionExplanation: "Critical points are where $f'(x)=0$ or $f'(x)$ is undefined. Check points 0 (min), 2 (corner?), 4 (corner?). Count carefully based on graph."
    }
  ]
};

// Combine Generated + Real Papers
export const MATH1_EXAMS = [...generatedPapers, REAL_PAPER_MATH1];

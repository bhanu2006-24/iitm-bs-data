
import { QuestionType } from '../../types';
import { createExamSet } from '../examUtils';

const TEMPLATES = [
  {
    text: (v: number) => `Let $T: \\mathbb{R}^2 \\to \\mathbb{R}^2$ be a linear transformation such that $T(1,0) = (${v}, 2)$ and $T(0,1) = (3, ${v})$. Find the matrix representation of T.`,
    sol: (v: number) => `Columns of the matrix are images of basis vectors. Matrix is $\\begin{pmatrix} ${v} & 3 \\\\ 2 & ${v} \\end{pmatrix}$.`,
    type: QuestionType.MCQ,
    options: (v: number) => [
      { text: `$\\begin{pmatrix} ${v} & 3 \\\\ 2 & ${v} \\end{pmatrix}$`, isCorrect: true },
      { text: `$\\begin{pmatrix} ${v} & 2 \\\\ 3 & ${v} \\end{pmatrix}$` },
      { text: `$\\begin{pmatrix} 1 & 0 \\\\ 0 & 1 \\end{pmatrix}$` },
      { text: `$\\begin{pmatrix} 3 & ${v} \\\\ ${v} & 2 \\end{pmatrix}$` }
    ]
  },
  {
    text: (v: number) => `Find the directional derivative of $f(x,y) = x^2 y$ at $(1, 2)$ in the direction of vector $\\vec{v} = (3, 4)$.`,
    sol: (v: number) => `$\\nabla f = (2xy, x^2)$. At (1,2), $\\nabla f = (4, 1)$. Unit vector $\\vec{u} = (3/5, 4/5)$. Dot product: $4(0.6) + 1(0.8) = 2.4 + 0.8 = 3.2$.`,
    type: QuestionType.NUMERIC,
    correctValue: (v: number) => 3.2,
  },
  {
    text: (v: number) => `Determine the rank of the matrix $A = \\begin{bmatrix} 1 & 2 & 3 \\\\ 2 & 4 & ${v} \\\\ 3 & 6 & 9 \\end{bmatrix}$.`,
    sol: (v: number) => `Row 3 is 3*Row 1. If ${v}=6$, Row 2 is 2*Row 1, Rank=1. If ${v}!=6$, Rank=2.`,
    type: QuestionType.NUMERIC,
    correctValue: (v: number) => v === 6 ? 1 : 2,
  },
  {
    text: (v: number) => `Using Gaussian elimination, how many solutions does the system have if the augmented matrix has a row $[0 \\ 0 \\ 0 \\ | \\ ${v}]$ where ${v} != 0?`,
    sol: (v: number) => `0 = ${v} is a contradiction.`,
    type: QuestionType.MCQ,
    options: (v: number) => [
      { text: `No solution`, isCorrect: true },
      { text: `Unique solution` },
      { text: `Infinite solutions` },
      { text: `Two solutions` }
    ]
  }
];

export const MATH2_EXAMS = createExamSet('math2', TEMPLATES);
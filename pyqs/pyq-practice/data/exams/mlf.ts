
import { ExamPaper, ExamType, QuestionType } from '../../types';
import { createExamSet } from '../examUtils';

const TEMPLATES = [
  {
    text: (v: number) => `In Linear Regression, what does the 'Residual' represent?`,
    sol: (v: number) => `Difference between actual and predicted value.`,
    type: QuestionType.MCQ,
    options: (v: number) => [
      { text: `Actual - Predicted`, isCorrect: true },
      { text: `Predicted - Mean` },
      { text: `Slope` },
      { text: `Intercept` }
    ]
  },
  {
    text: (v: number) => `Calculate the MSE if errors are [2, -2, 1, -1]. (N=4)`,
    sol: (v: number) => `Squared errors: 4, 4, 1, 1. Sum = 10. Mean = 10/4 = 2.5.`,
    type: QuestionType.NUMERIC,
    correctValue: (v: number) => 2.5,
  },
  {
    text: (v: number) => `Which metric is best for a binary classifier with skewed classes?`,
    sol: (v: number) => `Accuracy is bad for skewed classes. F1 or AUC is better.`,
    type: QuestionType.MCQ,
    options: (v: number) => [
      { text: `F1 Score`, isCorrect: true },
      { text: `Accuracy` },
      { text: `MSE` },
      { text: `R-Squared` }
    ]
  }
];

const generatedPapers = createExamSet('mlf', TEMPLATES);

// ============================================================================
// REAL STATIC PAPER (Based on PDF Input)
// ============================================================================
const REAL_MLF_PAPER: ExamPaper = {
  id: 'mlf-real-2022-et',
  title: 'End Term - 2022 (Real)',
  subjectId: 'mlf',
  examType: ExamType.END_TERM,
  year: '2022',
  set: 'Set A',
  durationMinutes: 120,
  totalMarks: 100,
  questions: [
    {
      id: 'mlf-q413',
      subjectId: 'mlf',
      type: QuestionType.MSQ,
      marks: 4,
      text: "Which of the following statements regarding classification and regression models are correct?",
      options: [
        { id: 'opt1', text: "In Regression, the output variable must be of continuous nature or real value but In Classification, the output variable is categorical.", isCorrect: true },
        { id: 'opt2', text: "In Regression, we try to find the best fit line... but In Classification, we try to find the decision boundary.", isCorrect: true },
        { id: 'opt3', text: "The Classification Algorithm can be further divided into Linear and Non-linear classifier...", isCorrect: true },
        { id: 'opt4', text: "Regression algorithms can be used to solve... Weather Prediction, House price prediction...", isCorrect: true }
      ],
      solutionExplanation: "All options describe fundamental differences and applications of Regression vs Classification correctly."
    },
    {
      id: 'mlf-q63',
      subjectId: 'mlf',
      type: QuestionType.MCQ,
      marks: 5,
      text: "Consider a polynomial $p(x) = 0.3x^3(x^2 - 1)(x - 2)^2(x - 3)$. Which of the figure represents the polynomial $p(x)$?",
      options: [
          { id: 'opt1', text: "", imgUrl: "https://placehold.co/400x300/png?text=Graph+A+(Roots+0,1,-1,2,3)", isCorrect: false },
          { id: 'opt2', text: "", imgUrl: "https://placehold.co/400x300/png?text=Graph+B+(Correct+End+Behavior)", isCorrect: true },
          { id: 'opt3', text: "", imgUrl: "https://placehold.co/400x300/png?text=Graph+C", isCorrect: false },
          { id: 'opt4', text: "", imgUrl: "https://placehold.co/400x300/png?text=Graph+D", isCorrect: false }
      ],
      solutionExplanation: "Analyze roots and multiplicity. Root at 0 (odd), 1, -1 (odd), 2 (even - touches axis), 3 (odd). End behavior: Degree 3+2+2+1 = 8 (Even degree), positive coeff -> Up/Up."
    },
    {
      id: 'mlf-q415',
      subjectId: 'mlf',
      type: QuestionType.MSQ,
      marks: 4,
      text: "Which among the following options are correct regarding matrix $A$ and system $Ax=b$?",
      options: [
        { id: 'opt1', text: "If the columns of $A$ are linearly independent, then $Ax = b$ has exactly one solution for every $b$.", isCorrect: false },
        { id: 'opt2', text: "If the columns of $A$ are linearly independent and if the solution for $Ax = b$ exists, then it is unique.", isCorrect: true },
        { id: 'opt3', text: "If $Ax = b$ has a unique solution, then $A$ is a square matrix.", isCorrect: false },
        { id: 'opt4', text: "If the columns of a matrix $A$ are linearly dependent, then $Ax = 0$ has a nontrivial solution.", isCorrect: true }
      ],
      solutionExplanation: "Linear independence implies uniqueness if a solution exists (Full column rank). Dependence implies free variables, thus non-trivial null space."
    },
    {
      id: 'mlf-q418',
      subjectId: 'mlf',
      type: QuestionType.MSQ,
      marks: 3,
      text: "Which among the following is a convex function?",
      options: [
        { id: 'opt1', text: "$x \\log_2 x, x > 0$", isCorrect: true },
        { id: 'opt2', text: "$-\\log(1+x), x > 1$", isCorrect: true },
        { id: 'opt3', text: "$5x^6 + 3x^2 - 1000, x \\in \\mathbb{R}$", isCorrect: true },
        { id: 'opt4', text: "$x^3, x \\in \\mathbb{R}$", isCorrect: false }
      ],
      solutionExplanation: "Check the second derivative. If $f''(x) \\ge 0$, the function is convex. $x^3$ changes concavity at 0."
    },
    {
      id: 'mlf-q213',
      subjectId: 'mlf',
      type: QuestionType.MCQ,
      marks: 2,
      text: "Provided below is a snapshot of the dataset which consists of movie reviews and respective labels. To compute the sentiment scores the Azure Machine Learning add-in requires input and output values.",
      imgUrl: "https://placehold.co/500x200/png?text=Dataset+Snapshot%0A(Col+A:+Sentiment,+Col+B:+Review)",
      options: [
          { id: 'opt1', text: "Input: Sheet1!A1:A11 Output: Sheet!C1", isCorrect: false },
          { id: 'opt2', text: "Input: Sheet1!B1:B11 Output: Sheet!C1", isCorrect: true }
      ],
      solutionExplanation: "Input should be the text (Reviews, Col B) to predict the sentiment. Output destination can be C1."
    },
    {
      id: 'mlf-q422',
      subjectId: 'mlf',
      type: QuestionType.NUMERIC,
      marks: 3,
      text: "Suppose the covariance matrix $C = \\begin{bmatrix} 4 & 2 \\\\ 2 & 4 \\end{bmatrix}$. Using PCA, project data onto a line. What is the projected variance? (Enter integer)",
      correctValue: 6,
      solutionExplanation: "Projected variance is the maximum eigenvalue. Char eq: $(4-\\lambda)^2 - 4 = 0 \\implies 4-\\lambda = \\pm 2 \\implies \\lambda = 6, 2$. Max variance is 6."
    },
    {
      id: 'mlf-q425',
      subjectId: 'mlf',
      type: QuestionType.MSQ,
      marks: 4,
      text: "A student wants to purchase snacks (brownies $x_1$, cakes $x_2$). Max 8 brownies, Max 12 cakes. Total items > 14. Cost: 50 $x_1$, 80 $x_2$. Minimal cost. Which options are true?",
      options: [
        { id: 'opt1', text: "In primal linear program, the function to be minimized is $50x_1 + 80x_2$.", isCorrect: true },
        { id: 'opt2', text: "Constraints are $x_1 \\le 8, x_2 \\le 12$, and $x_1 + x_2 > 14$.", isCorrect: true },
        { id: 'opt3', text: "Constraints are $x_1 \\ge 8...$", isCorrect: false },
        { id: 'opt4', text: "Minimized function is $6x_1...$", isCorrect: false }
      ],
      solutionExplanation: "Objective: Min $50x_1 + 80x_2$. Constraints: $x_1 \\le 8, x_2 \\le 12, x_1+x_2 > 14$."
    },
    {
      id: 'mlf-q428',
      subjectId: 'mlf',
      type: QuestionType.MCQ,
      marks: 4,
      text: "Let $Z_1, Z_2 \\sim i.i.d. Normal(0, 1)$. Define $X_1 = Z_1 + 3Z_2 - 2$ and $X_2 = Z_1 - 2Z_2 + 1$. What is the distribution of $X = (X_1, X_2)$?",
      options: [
        { id: 'opt1', text: "Mean $[-2, 1]^T$, Covariance $[10, -5; -5, 5]$", isCorrect: true },
        { id: 'opt2', text: "Mean $[-2, 1]^T$, Covariance $[1, 1; 1, -2]$", isCorrect: false },
        { id: 'opt3', text: "Mean $[0, 0]^T$, Covariance $[10, -5; -5, 5]$", isCorrect: false },
        { id: 'opt4', text: "Mean $[0, 0]^T$, Covariance $[1, 3; 1, -2]$", isCorrect: false }
      ],
      solutionExplanation: "Mean is clearly $[-2, 1]$. Covariance: $Var(X_1) = 1^2 + 3^2 = 10$. $Var(X_2) = 1^2 + (-2)^2 = 5$. $Cov(X_1, X_2) = Cov(Z_1+3Z_2, Z_1-2Z_2) = 1(1) + 3(-2) = 1 - 6 = -5$."
    }
  ]
};

export const MLF_EXAMS = [...generatedPapers, REAL_MLF_PAPER];

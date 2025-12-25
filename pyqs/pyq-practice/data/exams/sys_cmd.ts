
import { QuestionType } from '../../types';
import { createExamSet } from '../examUtils';

const TEMPLATES = [
  {
    text: (v: number) => `Which command shows the manual page for a command?`,
    sol: (v: number) => `man command.`,
    type: QuestionType.MCQ,
    options: (v: number) => [
      { text: `man`, isCorrect: true },
      { text: `help` },
      { text: `doc` },
      { text: `info` }
    ]
  },
  {
    text: (v: number) => `How do you redirect output to a file, overwriting it?`,
    sol: (v: number) => `> overwrites, >> appends.`,
    type: QuestionType.MCQ,
    options: (v: number) => [
      { text: `>`, isCorrect: true },
      { text: `>>` },
      { text: `<` },
      { text: `|` }
    ]
  },
  {
    text: (v: number) => `What is the Process ID (PID) of the init/systemd process usually?`,
    sol: (v: number) => `PID 1.`,
    type: QuestionType.NUMERIC,
    correctValue: (v: number) => 1,
  }
];

export const SYS_CMD_EXAMS = createExamSet('sys_cmd', TEMPLATES);
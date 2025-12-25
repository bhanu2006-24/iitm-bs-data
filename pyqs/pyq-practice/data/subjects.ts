import { Level, Subject } from '../types';

export const SUBJECTS: Subject[] = [
  // Foundation Level
  { id: 'math1', name: 'Mathematics for Data Science I', level: Level.FOUNDATION, code: 'MA1001' },
  { id: 'stats1', name: 'Statistics for Data Science I', level: Level.FOUNDATION, code: 'ST1001' },
  { id: 'ct', name: 'Computational Thinking', level: Level.FOUNDATION, code: 'CT1001' },
  { id: 'python', name: 'Introduction to Python', level: Level.FOUNDATION, code: 'CS1001' },
  { id: 'english1', name: 'English I', level: Level.FOUNDATION, code: 'EN1001' },
  { id: 'math2', name: 'Mathematics for Data Science II', level: Level.FOUNDATION, code: 'MA1002' },
  { id: 'stats2', name: 'Statistics for Data Science II', level: Level.FOUNDATION, code: 'ST1002' },
  { id: 'english2', name: 'English II', level: Level.FOUNDATION, code: 'EN1002' },

  // Diploma in Programming
  { id: 'dbms', name: 'Database Management Systems', level: Level.DIPLOMA_PROG, code: 'CS2001' },
  { id: 'pdsa', name: 'Programming, Data Structures and Algorithms using Python', level: Level.DIPLOMA_PROG, code: 'CS2002' },
  { id: 'java', name: 'Programming in Java', level: Level.DIPLOMA_PROG, code: 'CS2003' },
  { id: 'mad1', name: 'Modern Application Development I', level: Level.DIPLOMA_PROG, code: 'CS2004' },
  { id: 'sys_cmd', name: 'System Commands', level: Level.DIPLOMA_PROG, code: 'CS2005' },
  { id: 'mad2', name: 'Modern Application Development II', level: Level.DIPLOMA_PROG, code: 'CS2006' },

  // Diploma in Data Science
  { id: 'mlf', name: 'Machine Learning Foundations', level: Level.DIPLOMA_DS, code: 'MLF2001' },
  { id: 'bdm', name: 'Business Data Management', level: Level.DIPLOMA_DS, code: 'BDM2001' },
  { id: 'tds', name: 'Tools in Data Science', level: Level.DIPLOMA_DS, code: 'TDS2001' },
  { id: 'mlt', name: 'Machine Learning Techniques', level: Level.DIPLOMA_DS, code: 'MLT2001' },
  { id: 'mlp', name: 'Machine Learning Practice', level: Level.DIPLOMA_DS, code: 'MLP2001' },
  { id: 'ba', name: 'Business Analytics', level: Level.DIPLOMA_DS, code: 'BA2001' },

  // Degree Level
  { id: 'ai', name: 'AI: Search Methods for Problem Solving', level: Level.DEGREE, code: 'AI3001' },
  { id: 'dl', name: 'Deep Learning', level: Level.DEGREE, code: 'DL3001' },
];
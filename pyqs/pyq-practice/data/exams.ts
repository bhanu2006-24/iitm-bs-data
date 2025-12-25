
import { ExamPaper } from '../types';

/**
 * ==============================================================================
 * EXAM REGISTRY
 * ==============================================================================
 * 
 * HOW TO ADD A NEW SUBJECT:
 * 1. Create a new file in ./exams/ (e.g. `new_subject.ts`)
 * 2. In that file, use `createExamSet` to generate the papers and export them.
 * 3. Import the array here.
 * 4. Add the imported array to the `PAPERS` list below.
 * ==============================================================================
 */

// Foundation
import { MATH1_EXAMS } from './exams/math1';
import { MATH2_EXAMS } from './exams/math2';
import { STATS1_EXAMS } from './exams/stats1';
import { STATS2_EXAMS } from './exams/stats2';
import { PYTHON_EXAMS } from './exams/python';
import { CT_EXAMS } from './exams/ct';
import { ENG1_EXAMS } from './exams/english1';
import { ENG2_EXAMS } from './exams/english2';

// Diploma Programming
import { JAVA_EXAMS } from './exams/java';
import { DBMS_EXAMS } from './exams/dbms';
import { PDSA_EXAMS } from './exams/pdsa';
import { MAD1_EXAMS } from './exams/mad1';
import { SYS_CMD_EXAMS } from './exams/sys_cmd';
import { MAD2_EXAMS } from './exams/mad2';

// Diploma Data Science
import { MLF_EXAMS } from './exams/mlf';
import { MLT_EXAMS } from './exams/mlt';
import { BDM_EXAMS } from './exams/bdm';
import { TDS_EXAMS } from './exams/tds';
import { MLP_EXAMS } from './exams/mlp';
import { BA_EXAMS } from './exams/ba';

// Degree
import { AI_EXAMS } from './exams/ai';
import { DL_EXAMS } from './exams/dl';

// Combine all papers into a single registry
const PAPERS: ExamPaper[] = [
    // --- Foundation ---
    ...MATH1_EXAMS,
    ...MATH2_EXAMS,
    ...STATS1_EXAMS,
    ...STATS2_EXAMS,
    ...PYTHON_EXAMS,
    ...CT_EXAMS,
    ...ENG1_EXAMS,
    ...ENG2_EXAMS,
    
    // --- Diploma Programming ---
    ...JAVA_EXAMS,
    ...DBMS_EXAMS,
    ...PDSA_EXAMS,
    ...MAD1_EXAMS,
    ...SYS_CMD_EXAMS,
    ...MAD2_EXAMS,

    // --- Diploma Data Science ---
    ...MLF_EXAMS,
    ...MLT_EXAMS,
    ...BDM_EXAMS,
    ...TDS_EXAMS,
    ...MLP_EXAMS,
    ...BA_EXAMS,

    // --- Degree ---
    ...AI_EXAMS,
    ...DL_EXAMS
];

export const EXAM_PAPERS = PAPERS;
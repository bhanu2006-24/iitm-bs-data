
import { CodingProblem } from '../../types';
import pythonData from './python.json';
import javaData from './java.json';
import sqlData from './sql.json';
import bashData from './system_commands.json';
import pdsaData from './pdsa.json';
import mlpData from './mlp.json';

export const PYTHON_PROBLEMS = pythonData as CodingProblem[];
export const JAVA_PROBLEMS = javaData as CodingProblem[];
export const SQL_PROBLEMS = sqlData as CodingProblem[];
export const BASH_PROBLEMS = bashData as CodingProblem[];
export const PDSA_PROBLEMS = pdsaData as CodingProblem[];
export const MLP_PROBLEMS = mlpData as CodingProblem[];

export const ALL_PROBLEMS: CodingProblem[] = [
    ...PYTHON_PROBLEMS,
    ...JAVA_PROBLEMS,
    ...SQL_PROBLEMS,
    ...BASH_PROBLEMS,
    ...PDSA_PROBLEMS,
    ...MLP_PROBLEMS
];

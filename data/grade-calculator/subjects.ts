
import { GradingSchema } from '../../types';

export const GRADING_SCHEMAS: GradingSchema[] = [
    // --- FOUNDATION ---
    {
        id: 'math1', subject: 'Mathematics I', level: 'Foundation',
        total_weeks: 12, best_of_weeks: 10,
        ga_weight: 0.1, f_weight: 0.6,
        has_quiz1: true, has_quiz2: true, has_oppe: false, has_project: false, has_bonus: false,
        calc_func: 'sep25_theory', custom_formula: '0.1GA + Max(0.6F + 0.2Max(Q1,Q2), 0.4F + 0.2Q1 + 0.3Q2)'
    },
    {
        id: 'stats1', subject: 'Statistics I', level: 'Foundation',
        total_weeks: 12, best_of_weeks: 10,
        ga_weight: 0.1, f_weight: 0.6,
        has_quiz1: true, has_quiz2: true, has_oppe: false, has_project: false, has_bonus: true,
        calc_func: 'sep25_theory', custom_formula: '0.1GA + Max(0.6F + 0.2Max(Q1,Q2), 0.4F + 0.2Q1 + 0.3Q2) + Bonus'
    },
    {
        id: 'python', subject: 'Intro to Python', level: 'Foundation',
        total_weeks: 12, best_of_weeks: 10,
        ga_weight: 0.1, f_weight: 0.4,
        has_quiz1: true, has_quiz2: false, has_oppe: true, has_project: false, has_bonus: true,
        has_ga_prog: true,
        calc_func: 'sep25_python', custom_formula: '0.1GA_Obj + 0.1GA_Prog + 0.1Q1 + 0.4F + 0.25Max(PE1,PE2) + 0.15Min(PE1,PE2)'
    },
    {
        id: 'math2', subject: 'Mathematics II', level: 'Foundation',
        total_weeks: 12, best_of_weeks: 10,
        ga_weight: 0.1, f_weight: 0.6,
        has_quiz1: true, has_quiz2: true, has_oppe: false, has_project: false, has_bonus: true,
        calc_func: 'math2', custom_formula: 'Formula * (1 + 0.01*Bonus)'
    },
    
    // --- DIPLOMA PROGRAMMING ---
    {
        id: 'dbms', subject: 'DBMS', level: 'Diploma',
        total_weeks: 12, best_of_weeks: 10,
        ga_weight: 0.1, f_weight: 0.4, 
        has_quiz1: true, has_quiz2: true, has_oppe: true, has_project: false, has_bonus: false,
        calc_func: 'custom', custom_formula: '0.04GA1 + 0.03GA2 + 0.03GA3 + 0.2OP + Max(0.45F+0.15MaxQ, 0.4F+0.1Q1+0.2Q2)'
    },
    {
        id: 'pdsa', subject: 'PDSA', level: 'Diploma',
        total_weeks: 12, best_of_weeks: 10,
        ga_weight: 0.1, f_weight: 0.4,
        has_quiz1: true, has_quiz2: true, has_oppe: true, has_project: false, has_bonus: false,
        calc_func: 'custom', custom_formula: '0.1GA + 0.4F + 0.2OP + Max(0.2MaxQ, 0.15(Q1+Q2))'
    },
    {
        id: 'java', subject: 'Java Programming', level: 'Diploma',
        total_weeks: 12, best_of_weeks: 10, 
        ga_weight: 0.1, f_weight: 0.3,
        has_quiz1: true, has_quiz2: true, has_oppe: true, has_project: false, has_bonus: false,
        calc_func: 'sep25_java', custom_formula: '0.1GA + 0.3F + 0.2Max(PE) + 0.1Min(PE) + Max(0.25MaxQ, 0.15Q1+0.25Q2)'
    },
    {
        id: 'appdev1', subject: 'App Dev 1', level: 'Diploma',
        total_weeks: 12, best_of_weeks: 10,
        ga_weight: 0.05, f_weight: 0.4, 
        has_quiz1: true, has_quiz2: true, has_oppe: false, has_project: false, has_bonus: false,
        has_gla: true,
        calc_func: 'custom', custom_formula: '0.15GLA + 0.05GA + Max(0.35F+0.2Q1+0.25Q2, 0.4F+0.3BestQ)'
    },
    {
        id: 'sc', subject: 'System Commands', level: 'Diploma',
        total_weeks: 10, best_of_weeks: 9,
        ga_weight: 0.1, f_weight: 0.3,
        has_quiz1: true, has_quiz2: false, has_oppe: true, has_project: true, has_bonus: false,
        has_bpt: true,
        calc_func: 'custom', custom_formula: '0.1GA + 0.2Q1 + 0.3OPE + 0.3F + 0.1BPTA'
    },

    // --- DIPLOMA DS ---
    {
        id: 'mlf', subject: 'ML Foundations', level: 'Diploma',
        total_weeks: 12, best_of_weeks: 10,
        ga_weight: 0.1, f_weight: 0.6,
        has_quiz1: true, has_quiz2: true, has_oppe: false, has_project: false, has_bonus: false,
        calc_func: 'sep25_theory'
    },
    {
        id: 'mlt', subject: 'ML Techniques', level: 'Diploma',
        total_weeks: 12, best_of_weeks: 10,
        ga_weight: 0.1, f_weight: 0.4,
        has_quiz1: true, has_quiz2: true, has_oppe: false, has_project: false, has_bonus: true,
        calc_func: 'custom', custom_formula: '0.1GA + 0.4F + Max(0.25(Q1+Q2), 0.4Max(Q1,Q2))'
    },
    {
        id: 'mlp', subject: 'ML Practice', level: 'Diploma',
        total_weeks: 10, best_of_weeks: 10,
        ga_weight: 0.1, f_weight: 0.3,
        has_quiz1: false, has_quiz2: false, has_oppe: true, has_project: true, has_bonus: false,
        calc_func: 'custom', custom_formula: '0.1GAA + 0.3F + 0.2OPPE1 + 0.2OPPE2 + 0.2Kaggle'
    },
    {
        id: 'bdm', subject: 'Business Data Mgmt', level: 'Diploma',
        total_weeks: 4, best_of_weeks: 3, 
        ga_weight: 0.3, f_weight: 0.3,
        has_quiz1: false, has_quiz2: true, has_oppe: false, has_project: true, has_bonus: false,
        has_timed: true,
        calc_func: 'custom', custom_formula: '0.3GA(Best 3/4) + 0.2Q2 + 0.2Timed + 0.3F'
    },
    {
        id: 'tds', subject: 'Tools in Data Science', level: 'Diploma',
        total_weeks: 8, best_of_weeks: 5,
        ga_weight: 0.2, f_weight: 0.2,
        has_quiz1: false, has_quiz2: false, has_oppe: false, has_project: true, has_bonus: false,
        calc_func: 'tds', custom_formula: '0.2GA + 0.2ROE + 0.2P1 + 0.2P2 + 0.2F'
    },
    {
        id: 'genai', subject: 'Intro to DL & GenAI', level: 'Diploma',
        total_weeks: 9, best_of_weeks: 9,
        ga_weight: 0.2, f_weight: 0.2,
        has_quiz1: true, has_quiz2: true, has_oppe: false, has_project: false, has_bonus: false,
        has_nppe: true,
        calc_func: 'custom', custom_formula: '0.2GA + 0.15Q1 + 0.15Q2 + 0.2F + 0.15NPPE1 + 0.15NPPE2'
    },

    // --- DEGREE ---
    {
        id: 'se', subject: 'Software Engineering', level: 'Degree',
        total_weeks: 10, best_of_weeks: 10,
        ga_weight: 0.05, f_weight: 0.4,
        has_quiz1: false, has_quiz2: true, has_oppe: false, has_project: true, has_bonus: false,
        calc_func: 'custom', custom_formula: '0.05GA + 0.2Q2 + 0.4F + 0.1GP1 + 0.1GP2 + 0.1PP + 0.05CP'
    },
    {
        id: 'industry4', subject: 'Industry 4.0', level: 'Degree',
        total_weeks: 12, best_of_weeks: 12,
        ga_weight: 0.4, f_weight: 0.3,
        has_quiz1: true, has_quiz2: true, has_oppe: false, has_project: true, has_bonus: false,
        has_game: true,
        calc_func: 'custom', custom_formula: '0.15(Q1+Q2) + 0.05Game + 0.4GA + 0.3F + 0.1Project'
    },
    {
        id: 'c_prog', subject: 'Programming in C', level: 'Degree',
        total_weeks: 10, best_of_weeks: 10,
        ga_weight: 0.05, f_weight: 0.3,
        has_quiz1: true, has_quiz2: false, has_oppe: true, has_project: false, has_bonus: false,
        has_ga_prog: true,
        calc_func: 'custom', custom_formula: '0.05GA + 0.1GA_Prog + 0.15Q1 + 0.2PE1 + 0.2PE2 + 0.3F'
    }
];

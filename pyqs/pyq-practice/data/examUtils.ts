import { ExamPaper, ExamType, Question, QuestionOption } from '../types';

export const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export const generateQuestions = (
    subjectId: string, 
    count: number, 
    templates: any[], 
    examTypeStr: string,
    year: string,
    set: string
): Question[] => {
    return Array.from({ length: count }).map((_, i) => {
        // Deterministic randomness based on index
        const seed = (i % 5) + 3;
        const val = i + seed;
        const t = templates[i % templates.length];
        
        const q: Question = {
            id: `${subjectId}-${examTypeStr}-${year}-${set}-q${i}`,
            subjectId,
            type: t.type,
            marks: i % 5 === 0 ? 5 : 2,
            text: typeof t.text === 'function' ? t.text(val) : t.text,
            imgUrl: t.imgUrl ? (typeof t.imgUrl === 'function' ? t.imgUrl(val) : t.imgUrl) : undefined,
            options: t.options ? (typeof t.options === 'function' ? t.options(val) : t.options).map((o: any, idx: number) => ({
                id: `opt-${i}-${idx}`,
                text: o.text,
                imgUrl: o.imgUrl,
                isCorrect: o.isCorrect
            } as QuestionOption)) : undefined,
            correctValue: t.correctValue ? (typeof t.correctValue === 'function' ? t.correctValue(val) : t.correctValue) : undefined,
            range: t.range ? (typeof t.range === 'function' ? t.range(val) : t.range) : undefined,
            solutionExplanation: t.sol ? (typeof t.sol === 'function' ? t.sol(val) : t.sol) : undefined,
            codeSnippet: t.codeSnippet ? (typeof t.codeSnippet === 'function' ? t.codeSnippet(val) : t.codeSnippet) : undefined,
            context: t.context ? (typeof t.context === 'function' ? t.context(val) : t.context) : undefined,
        };
        return q;
    });
};

export const createExamSet = (subjectId: string, templates: any[]): ExamPaper[] => {
    const years = ['2021', '2022', '2023'];
    const types = [ExamType.QUIZ_1, ExamType.QUIZ_2, ExamType.END_TERM];
    
    const exams: ExamPaper[] = [];

    years.forEach(year => {
        types.forEach(type => {
            const duration = type === ExamType.END_TERM ? 120 : 60;
            const questionCount = type === ExamType.END_TERM ? 20 : 10;
            const set = 'Set A';
            const typeId = type.replace(/\s/g, '');
            
            const questions = generateQuestions(
                subjectId, 
                questionCount, 
                templates, 
                typeId,
                year, 
                set
            );

            const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);

            exams.push({
                id: `${subjectId}-${typeId}-${year}`,
                title: `${type} - ${year}`,
                subjectId,
                examType: type,
                year,
                set,
                questions,
                durationMinutes: duration,
                totalMarks
            });
        });
    });

    return exams;
};
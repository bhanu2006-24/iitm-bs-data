
import { FullCourseContent } from '../../types';
import MA1001 from './content/MA1001.json';
import MA1002 from './content/MA1002.json';
import CS1002 from './content/CS1002.json';
import CS1001 from './content/CS1001.json';
import ST1001 from './content/ST1001.json';
import ST1002 from './content/ST1002.json';
import EN1001 from './content/EN1001.json';
import EN1002 from './content/EN1002.json';

export const COURSE_CONTENT_MAP: Record<string, FullCourseContent> = {
    'MA1001': MA1001 as unknown as FullCourseContent,
    'MA1002': MA1002 as unknown as FullCourseContent,
    'CS1002': CS1002 as unknown as FullCourseContent,
    'CS1001': CS1001 as unknown as FullCourseContent,
    'ST1001': ST1001 as unknown as FullCourseContent,
    'ST1002': ST1002 as unknown as FullCourseContent,
    'EN1001': EN1001 as unknown as FullCourseContent,
    'EN1002': EN1002 as unknown as FullCourseContent,
};


import { WikiCourse, CourseReview } from '../../types';
import coursesData from './courses.json';
import reviewsData from './reviews.json';

export const WIKI_COURSES: WikiCourse[] = coursesData as WikiCourse[];
export const COURSES: CourseReview[] = reviewsData as CourseReview[]; // Exporting as COURSES to match original reviews.ts export name if it was COURSES or REVIEWS. 
// Step 355 shows `export const COURSES: CourseReview[] = [...]`. So matching that.

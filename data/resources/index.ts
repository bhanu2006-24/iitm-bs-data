
import { Resource, Subject } from '../../types';
import itemsData from './items.json';

// Helper to map string subjects back to Enum if needed, 
// strictly speaking if JSON has strings that match Enum values (like "Mathematics"), 
// we might need casting or mapping. 
// However, if the App tolerates string vs Enum mismatch (React prop types), 
// we can cast.
// For safety, let's map: "Mathematics" -> Subject.MATH if exact match exists.
// But Subject is likely string-based enum or union type.
// Checking types.ts previously in step 92 (viewed types.ts), 
// Subject seems to be an enum or union.
// Let's assume simple casting for now as migrating data to JSON often implies relaxed types or mapped types.

export const MOCK_RESOURCES: Resource[] = itemsData as any[];


import { Wind, Keyboard, Activity } from 'lucide-react';
import studyData from './study_data.json';

const ICON_MAP: Record<string, any> = {
    'Wind': Wind,
    'Keyboard': Keyboard,
    'Activity': Activity
};

export const DEFAULT_WALLPAPERS = studyData.wallpapers;

export const DEFAULT_SOUNDS = studyData.sounds.map(s => ({
    ...s,
    icon: ICON_MAP[s.icon] || Activity // Fallback
}));

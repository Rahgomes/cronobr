import { WorkoutCategory } from '../lib/storage';
import { Ionicons } from '@expo/vector-icons';

export interface Modality {
  id: string;
  category: WorkoutCategory;
  displayName: string; // Translated name
  technicalName: string; // CAPS name (HIIT, TABATA, etc.)
  description: string; // Short description
  icon: keyof typeof Ionicons.glyphMap;
  color: string; // Hex color
}

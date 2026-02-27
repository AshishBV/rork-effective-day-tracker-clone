export type CategoryKey = 'P' | 'A' | 'EC' | 'CA' | 'I' | 'S' | 'TW';

export interface Category {
  key: CategoryKey;
  label: string;
  points: number;
  color: string;
  textColor: string;
}

export const CATEGORIES: Record<CategoryKey, Category> = {
  P: { key: 'P', label: 'Personal', points: 1.0, color: '#104911', textColor: '#FFFFFF' },
  A: { key: 'A', label: 'Academic', points: 1.0, color: '#127475', textColor: '#FFFFFF' },
  EC: { key: 'EC', label: 'Extra Curricular', points: 1.0, color: '#FFE5A0', textColor: '#111111' },
  CA: { key: 'CA', label: "Couldn't Avoid", points: 0.5, color: '#E6E6E6', textColor: '#111111' },
  I: { key: 'I', label: 'Internet', points: 0.0, color: '#720026', textColor: '#FFFFFF' },
  S: { key: 'S', label: 'Sleep', points: 0.0, color: '#720026', textColor: '#FFFFFF' },
  TW: { key: 'TW', label: 'Time Waste', points: 0.0, color: '#720026', textColor: '#FFFFFF' },
};

export const CATEGORY_ORDER: CategoryKey[] = ['P', 'A', 'EC', 'CA', 'I', 'S', 'TW'];
export const QUICK_LOG_ROW1: CategoryKey[] = ['P', 'A', 'EC', 'CA'];
export const QUICK_LOG_ROW2: CategoryKey[] = ['I', 'S', 'TW'];

export const ACTIVITY_DISPLAY_ORDER: CategoryKey[] = ['P', 'I', 'EC', 'CA', 'A', 'S', 'TW'];

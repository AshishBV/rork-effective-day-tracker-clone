export interface Activity {
  id: string;
  code: string;
  name: string;
  points: number;
  erPoints: number;
  color: string;
  textColor: string;
  isActive: boolean;
  sortOrder: number;
}

export const ER_POINTS_MAP: Record<string, number> = {
  'P': 1,
  'A': 1,
  'EC': 1,
  'CA': 0.5,
  'I': 0,
  'S': 0,
  'J': 1,
  'TW': 0,
};

export function getErPointsForCode(code: string): number {
  const upperCode = code.toUpperCase();
  if (upperCode in ER_POINTS_MAP) {
    return ER_POINTS_MAP[upperCode];
  }
  return upperCode === 'CA' ? 0.5 : (upperCode.length <= 2 ? 1 : 0);
}

export const FIXED_TOTAL_SLOTS = 72;

export const VALID_SLOT_DURATIONS = [15, 30, 60] as const;
export type ValidSlotDuration = typeof VALID_SLOT_DURATIONS[number];

export const DEFAULT_ACTIVITIES: Activity[] = [
  { id: 'act_p', code: 'P', name: 'Personal', points: 1, erPoints: 1, color: '#104911', textColor: '#FFFFFF', isActive: true, sortOrder: 0 },
  { id: 'act_a', code: 'A', name: 'Academics', points: 1, erPoints: 1, color: '#127475', textColor: '#FFFFFF', isActive: true, sortOrder: 1 },
  { id: 'act_ec', code: 'EC', name: 'Extra-curricular', points: 1, erPoints: 1, color: '#FFE5A0', textColor: '#111111', isActive: true, sortOrder: 2 },
  { id: 'act_ca', code: 'CA', name: "Couldn't Avoid", points: 0, erPoints: 0.5, color: '#E6E6E6', textColor: '#111111', isActive: true, sortOrder: 3 },
  { id: 'act_i', code: 'I', name: 'Internet', points: 0, erPoints: 0, color: '#720026', textColor: '#FFFFFF', isActive: true, sortOrder: 4 },
  { id: 'act_s', code: 'S', name: 'Sleep', points: 0, erPoints: 0, color: '#720026', textColor: '#FFFFFF', isActive: true, sortOrder: 5 },
  { id: 'act_j', code: 'J', name: 'Job search', points: 1, erPoints: 1, color: '#e66d1c', textColor: '#FFFFFF', isActive: true, sortOrder: 6 },
  { id: 'act_tw', code: 'TW', name: 'Time Waste', points: 0, erPoints: 0, color: '#8B0000', textColor: '#FFFFFF', isActive: true, sortOrder: 7 },
];

export interface TimeSlot {
  index: number;
  timeIn: string;
  timeOut: string;
  activityCategory: string | null;
  plannedCategory: string | null;
  performedActivityText: string;
  pointsOverride: number | null;
}

export interface Habit {
  id: string;
  name: string;
  emoji: string;
  active: boolean;
}

export interface DayData {
  date: string;
  slots: TimeSlot[];
  habits: boolean[];
  habitCompletions: Record<string, boolean>;
  todos: { text: string; completed: boolean }[];
  gratitude: string[];
  highlights: string[];
  sleepHours: number | null;
  steps: number | null;
}

export type ThemeMode = 'light' | 'dark' | 'system' | 'auto';

export interface TimeSettings {
  slotDuration: number;
  dayStartHour: number;
  dayStartMinute: number;
  dayEndHour: number;
  dayEndMinute: number;
}

export type NotificationFrequency = 15 | 30 | 60 | 'custom';

export interface Settings {
  erGoal: number;
  sleepGoal: number;
  stepsGoal: number;
  notificationsEnabled: boolean;
  notificationFrequency: NotificationFrequency;
  customNotificationMinutes: number;
  quietHoursStart: string;
  quietHoursEnd: string;
  stopWhenComplete: boolean;
  strictMode: boolean;
  categoryOverrides: Record<string, { points: number; color: string }> | null;
  themeMode: ThemeMode;
  customHabits: Habit[];
  displayName: string;
  dailyReminderEnabled: boolean;
  quoteText: string;
  timeSettings: TimeSettings;
  useSimplePoints: boolean;
  bannerColor: string;
}

export const DEFAULT_HABITS: Habit[] = [
  { id: 'h1', name: '10 minutes meditation', emoji: '🧘', active: true },
  { id: 'h2', name: '20 minutes reading', emoji: '📚', active: true },
  { id: 'h3', name: '30 minutes exercise', emoji: '💪', active: true },
  { id: 'h4', name: 'Drink 8 glasses of water', emoji: '💧', active: true },
  { id: 'h5', name: 'Screen time < 1 hour', emoji: '📱', active: true },
];

export const DEFAULT_HABIT_NAMES = [
  '10 minutes meditation',
  '20 minutes reading',
  '30 minutes exercise',
  'Drink 8 glasses of water',
  'Screen time < 1 hour',
];

export const DEFAULT_QUOTE = "I Always Have More Money Than I Need,\nI Cannot Help But Attract Lot of Money Into My Life";

export const DEFAULT_TIME_SETTINGS: TimeSettings = {
  slotDuration: 15,
  dayStartHour: 5,
  dayStartMinute: 0,
  dayEndHour: 23,
  dayEndMinute: 0,
};

export const DEFAULT_SETTINGS: Settings = {
  erGoal: 80,
  sleepGoal: 6,
  stepsGoal: 6000,
  notificationsEnabled: true,
  notificationFrequency: 15,
  customNotificationMinutes: 45,
  quietHoursStart: '23:00',
  quietHoursEnd: '05:00',
  stopWhenComplete: false,
  strictMode: false,
  categoryOverrides: null,
  themeMode: 'light',
  customHabits: DEFAULT_HABITS,
  displayName: '',
  dailyReminderEnabled: true,
  quoteText: DEFAULT_QUOTE,
  timeSettings: DEFAULT_TIME_SETTINGS,
  useSimplePoints: false,
  bannerColor: '#0A0A0A',
};

import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useMemo } from 'react';
import { DayData, Settings, DEFAULT_SETTINGS, DEFAULT_HABITS, Habit, DEFAULT_TIME_SETTINGS, TimeSlot } from '../types/data';
import { generateTimeSlots, getDateKey, calculateDayER, calculateTotalSlots, mergeSlotsByTime } from '../utils/timeUtils';
import { fetchAppData, isSupabaseConfigured, debouncedUpsert, getLocalSyncTimestamp } from '../lib/supabase';

const DAYS_STORAGE_KEY = 'effective_day_tracker_days';
const SETTINGS_STORAGE_KEY = 'effective_day_tracker_settings';

function createEmptyDay(dateKey: string, settings?: Settings): DayData {
  const timeSettings = settings?.timeSettings || DEFAULT_TIME_SETTINGS;
  return {
    date: dateKey,
    slots: generateTimeSlots(timeSettings),
    habits: [false, false, false, false, false],
    habitCompletions: {},
    todos: Array(5).fill(null).map(() => ({ text: '', completed: false })),
    gratitude: ['', '', ''],
    highlights: ['', '', '', '', ''],
    sleepHours: null,
    steps: null,
  };
}

export const [DataProvider, useData] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(() => getDateKey(new Date()));
  const daysQuery = useQuery({
    queryKey: ['days'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(DAYS_STORAGE_KEY);
      const localData = stored ? JSON.parse(stored) as Record<string, DayData> : {};
      const localCount = Object.keys(localData).length;
      console.log(`[DataContext] Loaded ${localCount} days from local storage`);

      if (isSupabaseConfigured()) {
        try {
          const { data: cloudData, updatedAt: cloudUpdatedAt } = await fetchAppData<Record<string, DayData>>('days');
          if (cloudData && Object.keys(cloudData).length > 0) {
            const localSyncTs = await getLocalSyncTimestamp('days');
            const cloudIsNewer = cloudUpdatedAt && (!localSyncTs || new Date(cloudUpdatedAt) > new Date(localSyncTs));

            const merged: Record<string, DayData> = { ...localData };

            Object.keys(cloudData).forEach(dateKey => {
              if (!merged[dateKey]) {
                merged[dateKey] = cloudData[dateKey];
              } else if (cloudIsNewer) {
                const localSlotsFilled = merged[dateKey].slots.filter(s => s.activityCategory !== null).length;
                const cloudSlotsFilled = cloudData[dateKey].slots.filter(s => s.activityCategory !== null).length;
                if (cloudSlotsFilled > localSlotsFilled) {
                  merged[dateKey] = cloudData[dateKey];
                }
              }
            });

            await AsyncStorage.setItem(DAYS_STORAGE_KEY, JSON.stringify(merged));
            console.log(`[DataContext] Merged ${Object.keys(merged).length} days (local: ${localCount}, cloud: ${Object.keys(cloudData).length})`);
            return merged;
          }
        } catch (e) {
          console.log('[DataContext] Cloud fetch failed, using local:', e);
        }
      }

      return localData;
    },
  });

  const settingsQuery = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      const localSettings = stored ? JSON.parse(stored) as Settings : null;
      console.log(`[DataContext] Local settings loaded: ${localSettings ? 'yes' : 'no'}`);

      if (isSupabaseConfigured()) {
        try {
          const { data: cloudSettings, updatedAt: cloudUpdatedAt } = await fetchAppData<Settings>('settings');
          if (cloudSettings) {
            const localSyncTs = await getLocalSyncTimestamp('settings');
            const cloudIsNewer = cloudUpdatedAt && (!localSyncTs || new Date(cloudUpdatedAt) > new Date(localSyncTs));

            if (!localSettings) {
              await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(cloudSettings));
              console.log('[DataContext] Restored settings from cloud (no local)');
              return cloudSettings;
            } else if (cloudIsNewer) {
              const merged = { ...localSettings, ...cloudSettings };
              await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(merged));
              console.log('[DataContext] Merged settings (cloud was newer)');
              return merged;
            }
          }
        } catch (e) {
          console.log('[DataContext] Cloud settings fetch failed:', e);
        }
      }

      return localSettings || DEFAULT_SETTINGS;
    },
  });

  const syncDaysToCloud = useCallback((daysData: Record<string, DayData>) => {
    debouncedUpsert('days', daysData);
  }, []);

  const syncSettingsToCloud = useCallback((settingsData: Settings) => {
    debouncedUpsert('settings', settingsData);
  }, []);

  const { mutate: saveDays } = useMutation({
    mutationFn: async (daysData: Record<string, DayData>) => {
      await AsyncStorage.setItem(DAYS_STORAGE_KEY, JSON.stringify(daysData));
      return daysData;
    },
    onSuccess: (daysData) => {
      queryClient.setQueryData(['days'], daysData);
      syncDaysToCloud(daysData);
    },
  });

  const { mutate: saveSettings } = useMutation({
    mutationFn: async (settingsData: Settings) => {
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settingsData));
      return settingsData;
    },
    onSuccess: (settingsData) => {
      queryClient.setQueryData(['settings'], settingsData);
      syncSettingsToCloud(settingsData);
    },
  });

  const days = useMemo(() => daysQuery.data || {}, [daysQuery.data]);
  const settings = useMemo(() => settingsQuery.data || DEFAULT_SETTINGS, [settingsQuery.data]);

  const getSelectedDay = useCallback((): DayData => {
    if (days[selectedDate]) {
      const dayData = days[selectedDate];
      const expectedSlots = calculateTotalSlots(settings.timeSettings);
      if (dayData.slots.length !== expectedSlots) {
        const newSlots = generateTimeSlots(settings.timeSettings);
        mergeSlotsByTime(dayData.slots, newSlots);
        const updatedDay = { ...dayData, slots: newSlots };
        const updatedDays = { ...days, [selectedDate]: updatedDay };
        saveDays(updatedDays);
        return updatedDay;
      }
      return dayData;
    }
    return createEmptyDay(selectedDate, settings);
  }, [days, selectedDate, settings, saveDays]);

  const getDayByDate = useCallback((dateKey: string): DayData => {
    if (days[dateKey]) {
      return days[dateKey];
    }
    return createEmptyDay(dateKey, settings);
  }, [days, settings]);

  const updateSlot = useCallback((slotIndex: number, updates: Partial<TimeSlot>, dateKey?: string) => {
    const targetDate = dateKey || selectedDate;
    const day = days[targetDate] || createEmptyDay(targetDate, settings);
    const updatedSlots = [...day.slots];
    if (slotIndex < updatedSlots.length) {
      updatedSlots[slotIndex] = { ...updatedSlots[slotIndex], ...updates };
    }
    
    const updatedDay = { ...day, slots: updatedSlots };
    const updatedDays = { ...days, [targetDate]: updatedDay };
    saveDays(updatedDays);
  }, [days, selectedDate, saveDays, settings]);

  const updateMultipleSlots = useCallback((slotIndices: number[], updates: Partial<TimeSlot>, dateKey?: string) => {
    const targetDate = dateKey || selectedDate;
    const day = days[targetDate] || createEmptyDay(targetDate, settings);
    const updatedSlots = [...day.slots];
    
    slotIndices.forEach(index => {
      if (index < updatedSlots.length) {
        updatedSlots[index] = { ...updatedSlots[index], ...updates };
      }
    });
    
    const updatedDay = { ...day, slots: updatedSlots };
    const updatedDays = { ...days, [targetDate]: updatedDay };
    saveDays(updatedDays);
  }, [days, selectedDate, saveDays, settings]);

  const clearSlots = useCallback((slotIndices: number[], dateKey?: string) => {
    const targetDate = dateKey || selectedDate;
    const day = days[targetDate] || createEmptyDay(targetDate, settings);
    const updatedSlots = [...day.slots];
    
    slotIndices.forEach(index => {
      if (index < updatedSlots.length) {
        updatedSlots[index] = {
          ...updatedSlots[index],
          activityCategory: null,
          performedActivityText: '',
          pointsOverride: null,
        };
      }
    });
    
    const updatedDay = { ...day, slots: updatedSlots };
    const updatedDays = { ...days, [targetDate]: updatedDay };
    saveDays(updatedDays);
  }, [days, selectedDate, saveDays, settings]);

  const updateDayReview = useCallback((updates: Partial<DayData>, dateKey?: string) => {
    const targetDate = dateKey || selectedDate;
    const day = days[targetDate] || createEmptyDay(targetDate, settings);
    const updatedDay = { ...day, ...updates };
    const updatedDays = { ...days, [targetDate]: updatedDay };
    saveDays(updatedDays);
  }, [days, selectedDate, saveDays, settings]);

  const updateSettings = useCallback((updates: Partial<Settings>) => {
    const updatedSettings = { ...settings, ...updates };
    saveSettings(updatedSettings);
  }, [settings, saveSettings]);

  const getAllDays = useCallback((): DayData[] => {
    return Object.values(days);
  }, [days]);

  const getDayER = useCallback((dateKey: string): number | null => {
    const day = days[dateKey];
    if (!day) return null;
    const filledCount = day.slots.filter(s => s.activityCategory !== null).length;
    if (filledCount === 0) return null;
    return calculateDayER(day.slots, undefined, undefined, settings.timeSettings);
  }, [days, settings.timeSettings]);

  const getActiveHabits = useCallback((): Habit[] => {
    const customHabits = settings.customHabits || DEFAULT_HABITS;
    return customHabits.filter(h => h.active);
  }, [settings.customHabits]);

  const getHabitCompletion = useCallback((dateKey: string, habitId: string): boolean => {
    const day = days[dateKey];
    if (!day) return false;
    return day.habitCompletions?.[habitId] || false;
  }, [days]);

  const setHabitCompletion = useCallback((dateKey: string, habitId: string, completed: boolean) => {
    const day = days[dateKey] || createEmptyDay(dateKey, settings);
    const updatedCompletions = { ...(day.habitCompletions || {}), [habitId]: completed };
    const updatedDay = { ...day, habitCompletions: updatedCompletions };
    const updatedDays = { ...days, [dateKey]: updatedDay };
    saveDays(updatedDays);
  }, [days, saveDays, settings]);

  const getDayHabitsSummary = useCallback((dateKey: string): { completed: number; total: number } => {
    const activeHabits = getActiveHabits();
    const day = days[dateKey];
    if (!day || !activeHabits.length) return { completed: 0, total: activeHabits.length };
    
    const completed = activeHabits.filter(h => day.habitCompletions?.[h.id]).length;
    return { completed, total: activeHabits.length };
  }, [days, getActiveHabits]);

  const getDayERPercentage = useCallback((dateKey: string): number | null => {
    const day = days[dateKey];
    if (!day) return null;
    const filledCount = day.slots.filter(s => s.activityCategory !== null).length;
    if (filledCount === 0) return null;
    return Math.round(calculateDayER(day.slots, undefined, undefined, settings.timeSettings) * 100);
  }, [days, settings.timeSettings]);

  const addHabit = useCallback((name: string, emoji: string) => {
    const newHabit: Habit = {
      id: `h_${Date.now()}`,
      name,
      emoji,
      active: true,
    };
    const updatedHabits = [...(settings.customHabits || DEFAULT_HABITS), newHabit];
    saveSettings({ ...settings, customHabits: updatedHabits });
  }, [settings, saveSettings]);

  const updateHabit = useCallback((habitId: string, updates: Partial<Habit>) => {
    const habits = settings.customHabits || DEFAULT_HABITS;
    const updatedHabits = habits.map(h => h.id === habitId ? { ...h, ...updates } : h);
    saveSettings({ ...settings, customHabits: updatedHabits });
  }, [settings, saveSettings]);

  const deleteHabit = useCallback((habitId: string) => {
    const habits = settings.customHabits || DEFAULT_HABITS;
    const updatedHabits = habits.filter(h => h.id !== habitId);
    saveSettings({ ...settings, customHabits: updatedHabits });
  }, [settings, saveSettings]);

  const reorderHabits = useCallback((fromIndex: number, toIndex: number) => {
    const habits = [...(settings.customHabits || DEFAULT_HABITS)];
    const [moved] = habits.splice(fromIndex, 1);
    habits.splice(toIndex, 0, moved);
    saveSettings({ ...settings, customHabits: habits });
  }, [settings, saveSettings]);

  const exportBackup = useCallback(async (): Promise<string> => {
    const backup = {
      days,
      settings,
      exportedAt: new Date().toISOString(),
      version: '1.0',
    };
    return JSON.stringify(backup, null, 2);
  }, [days, settings]);

  return {
    days,
    settings,
    selectedDate,
    setSelectedDate,
    getSelectedDay,
    getDayByDate,
    getDayER,
    getDayERPercentage,
    getDayHabitsSummary,
    getActiveHabits,
    getHabitCompletion,
    setHabitCompletion,
    addHabit,
    updateHabit,
    deleteHabit,
    reorderHabits,
    updateSlot,
    updateMultipleSlots,
    clearSlots,
    updateDayReview,
    updateSettings,
    getAllDays,
    exportBackup,
    isLoading: daysQuery.isLoading || settingsQuery.isLoading,
  };
});

export function useSelectedDay() {
  const { getSelectedDay } = useData();
  return useMemo(() => getSelectedDay(), [getSelectedDay]);
}

export function useDayByDate(dateKey: string) {
  const { getDayByDate } = useData();
  return useMemo(() => getDayByDate(dateKey), [getDayByDate, dateKey]);
}

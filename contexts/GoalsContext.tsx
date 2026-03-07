import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { debouncedUpsert, isSupabaseConfigured, fetchAppData, getLocalSyncTimestamp } from '../lib/supabase';

const GOALS_STORAGE_KEY = 'effective_day_tracker_goals';

export interface GoalItem {
  text: string;
  completed: boolean;
}

export interface PeriodGoals {
  periodKey: string;
  goals: GoalItem[];
}

export interface GoalsData {
  weekly: PeriodGoals;
  monthly: PeriodGoals;
  yearly: PeriodGoals;
}

function getWeekKey(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const dayOfWeek = d.getDay();
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  d.setDate(d.getDate() - diff);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `W-${year}-${month}-${day}`;
}

function getMonthKey(date: Date): string {
  return `M-${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getYearKey(date: Date): string {
  return `Y-${date.getFullYear()}`;
}

function createEmptyPeriodGoals(periodKey: string, count: number = 5): PeriodGoals {
  return {
    periodKey,
    goals: Array.from({ length: count }, () => ({ text: '', completed: false })),
  };
}

function createYearlyDefaultGoals(periodKey: string): PeriodGoals {
  return {
    periodKey,
    goals: [
      { text: 'Have 1M Subscribers on YouTube Channel', completed: false },
      { text: 'Earn 100K / month from Trading', completed: false },
      { text: 'Best Physical Shape', completed: false },
      { text: 'Best Mental Space', completed: false },
      { text: 'Buy BMW M5', completed: false },
    ],
  };
}

function getDefaultGoalsData(): GoalsData {
  const now = new Date();
  return {
    weekly: createEmptyPeriodGoals(getWeekKey(now)),
    monthly: createEmptyPeriodGoals(getMonthKey(now)),
    yearly: createYearlyDefaultGoals(getYearKey(now)),
  };
}

function autoResetIfNeeded(data: GoalsData): GoalsData {
  const now = new Date();
  const currentWeekKey = getWeekKey(now);
  const currentMonthKey = getMonthKey(now);
  const currentYearKey = getYearKey(now);

  let changed = false;
  const updated = { ...data };

  if (data.weekly.periodKey !== currentWeekKey) {
    updated.weekly = createEmptyPeriodGoals(currentWeekKey);
    changed = true;
  }
  if (data.monthly.periodKey !== currentMonthKey) {
    updated.monthly = createEmptyPeriodGoals(currentMonthKey);
    changed = true;
  }
  if (data.yearly.periodKey !== currentYearKey) {
    updated.yearly = createYearlyDefaultGoals(currentYearKey);
    changed = true;
  }

  if (changed) {
    console.log('[GoalsContext] Auto-reset triggered for new period(s)');
  }
  return updated;
}

export function getWeekResetLabel(): string {
  const now = new Date();
  const dayOfWeek = now.getDay();
  if (dayOfWeek === 0) return 'Resets today';
  const daysUntilSunday = 7 - dayOfWeek;
  if (daysUntilSunday === 1) return 'Resets tomorrow';
  return `Resets in ${daysUntilSunday} days`;
}

export function getMonthLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function getYearLabel(date: Date): string {
  return date.getFullYear().toString();
}

export const [GoalsProvider, useGoals] = createContextHook(() => {
  const queryClient = useQueryClient();

  const goalsQuery = useQuery({
    queryKey: ['goals'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(GOALS_STORAGE_KEY);
      let localData = stored ? (JSON.parse(stored) as GoalsData) : null;

      if (isSupabaseConfigured()) {
        try {
          const { data: cloudData, updatedAt: cloudUpdatedAt } = await fetchAppData<GoalsData>('goals');
          if (cloudData) {
            const localSyncTs = await getLocalSyncTimestamp('goals');
            const cloudIsNewer = cloudUpdatedAt && (!localSyncTs || new Date(cloudUpdatedAt) > new Date(localSyncTs));

            if (!localData) {
              localData = cloudData;
            } else if (cloudIsNewer) {
              localData = cloudData;
            }
          }
        } catch (e) {
          console.log('[GoalsContext] Cloud fetch failed, using local:', e);
        }
      }

      const data = localData || getDefaultGoalsData();
      const resetData = autoResetIfNeeded(data);

      if (resetData !== data || !localData) {
        await AsyncStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(resetData));
      }

      return resetData;
    },
  });

  const syncToCloud = useCallback((goalsData: GoalsData) => {
    debouncedUpsert('goals', goalsData);
  }, []);

  const { mutate: saveGoals } = useMutation({
    mutationFn: async (goalsData: GoalsData) => {
      await AsyncStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goalsData));
      return goalsData;
    },
    onSuccess: (goalsData) => {
      queryClient.setQueryData(['goals'], goalsData);
      syncToCloud(goalsData);
    },
  });

  const goalsData = useMemo(() => goalsQuery.data || getDefaultGoalsData(), [goalsQuery.data]);

  const updateGoalText = useCallback((period: 'weekly' | 'monthly' | 'yearly', index: number, text: string) => {
    const updated = { ...goalsData };
    const periodData = { ...updated[period] };
    const goals = [...periodData.goals];
    goals[index] = { ...goals[index], text };
    periodData.goals = goals;
    updated[period] = periodData;
    saveGoals(updated);
  }, [goalsData, saveGoals]);

  const toggleGoalCompleted = useCallback((period: 'weekly' | 'monthly' | 'yearly', index: number) => {
    const updated = { ...goalsData };
    const periodData = { ...updated[period] };
    const goals = [...periodData.goals];
    goals[index] = { ...goals[index], completed: !goals[index].completed };
    periodData.goals = goals;
    updated[period] = periodData;
    saveGoals(updated);
  }, [goalsData, saveGoals]);

  const resetPeriod = useCallback((period: 'weekly' | 'monthly' | 'yearly') => {
    const now = new Date();
    const key = period === 'weekly' ? getWeekKey(now) : period === 'monthly' ? getMonthKey(now) : getYearKey(now);
    const updated = { ...goalsData };

    updated[period] =
      period === 'yearly'
        ? createYearlyDefaultGoals(key)
        : createEmptyPeriodGoals(key);

    saveGoals(updated);
  }, [goalsData, saveGoals]);

  const getCompletionCount = useCallback((period: 'weekly' | 'monthly' | 'yearly') => {
    const goals = goalsData[period].goals;
    const filledGoals = goals.filter(g => g.text.trim().length > 0);
    const completedGoals = filledGoals.filter(g => g.completed);
    return { completed: completedGoals.length, total: filledGoals.length };
  }, [goalsData]);

  return {
    goalsData,
    updateGoalText,
    toggleGoalCompleted,
    resetPeriod,
    getCompletionCount,
    isLoading: goalsQuery.isLoading,
  };
});

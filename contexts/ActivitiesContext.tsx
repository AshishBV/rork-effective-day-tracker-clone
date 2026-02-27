import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { Activity, DEFAULT_ACTIVITIES, getErPointsForCode } from '../types/data';
import { fetchAppData, isSupabaseConfigured, debouncedUpsert, getLocalSyncTimestamp } from '../lib/supabase';

const ACTIVITIES_STORAGE_KEY = 'effective_day_tracker_activities';
const MIGRATION_KEY = 'effective_day_tracker_activities_migrated';

function generateId(): string {
  return `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export const [ActivitiesProvider, useActivities] = createContextHook(() => {
  const queryClient = useQueryClient();
  const [migrationComplete, setMigrationComplete] = useState(false);

  const activitiesQuery = useQuery({
    queryKey: ['activities'],
    queryFn: async () => {
      const migrated = await AsyncStorage.getItem(MIGRATION_KEY);
      const stored = await AsyncStorage.getItem(ACTIVITIES_STORAGE_KEY);
      const localData = stored ? JSON.parse(stored) as Activity[] : null;
      console.log(`[ActivitiesContext] Local activities loaded: ${localData ? localData.length : 0}`);

      if (isSupabaseConfigured()) {
        try {
          const { data: cloudData, updatedAt: cloudUpdatedAt } = await fetchAppData<Activity[]>('activities');
          if (cloudData && cloudData.length > 0) {
            const localSyncTs = await getLocalSyncTimestamp('activities');
            const cloudIsNewer = cloudUpdatedAt && (!localSyncTs || new Date(cloudUpdatedAt) > new Date(localSyncTs));

            if (!localData) {
              await AsyncStorage.setItem(ACTIVITIES_STORAGE_KEY, JSON.stringify(cloudData));
              console.log('[ActivitiesContext] Restored activities from cloud (no local)');
              return cloudData;
            } else if (cloudIsNewer) {
              const mergedMap = new Map<string, Activity>();
              localData.forEach(a => mergedMap.set(a.id, a));
              cloudData.forEach(a => mergedMap.set(a.id, a));
              const merged = Array.from(mergedMap.values()).sort((a, b) => a.sortOrder - b.sortOrder);
              await AsyncStorage.setItem(ACTIVITIES_STORAGE_KEY, JSON.stringify(merged));
              console.log(`[ActivitiesContext] Merged activities (local: ${localData.length}, cloud: ${cloudData.length}, merged: ${merged.length})`);
              return merged;
            }
          }
        } catch (e) {
          console.log('[ActivitiesContext] Cloud fetch failed:', e);
        }
      }

      if (localData) {
        return localData;
      }

      if (!migrated) {
        await AsyncStorage.setItem(ACTIVITIES_STORAGE_KEY, JSON.stringify(DEFAULT_ACTIVITIES));
        await AsyncStorage.setItem(MIGRATION_KEY, 'true');
      }

      return DEFAULT_ACTIVITIES;
    },
  });

  const syncActivitiesToCloud = useCallback((activitiesData: Activity[]) => {
    debouncedUpsert('activities', activitiesData);
  }, []);

  const saveActivitiesMutation = useMutation({
    mutationFn: async (activities: Activity[]) => {
      await AsyncStorage.setItem(ACTIVITIES_STORAGE_KEY, JSON.stringify(activities));
      return activities;
    },
    onSuccess: (activitiesData) => {
      queryClient.setQueryData(['activities'], activitiesData);
      syncActivitiesToCloud(activitiesData);
    },
  });

  const activities = activitiesQuery.data || DEFAULT_ACTIVITIES;

  const activeActivities = useMemo(() => {
    return [...activities]
      .filter(a => a.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [activities]);

  const sortedActivities = useMemo(() => {
    return [...activities].sort((a, b) => a.sortOrder - b.sortOrder);
  }, [activities]);

  const getActivityByCode = useCallback((code: string): Activity | undefined => {
    return activities.find(a => a.code.toUpperCase() === code.toUpperCase());
  }, [activities]);

  const getActivityById = useCallback((id: string): Activity | undefined => {
    return activities.find(a => a.id === id);
  }, [activities]);

  const addActivity = useCallback((data: { code: string; name: string; points?: number; color?: string; textColor?: string }) => {
    const maxSortOrder = Math.max(...activities.map(a => a.sortOrder), -1);
    const code = data.code.toUpperCase().slice(0, 3);
    const erPoints = getErPointsForCode(code);
    const newActivity: Activity = {
      id: generateId(),
      code,
      name: data.name,
      points: data.points ?? 0,
      erPoints,
      color: data.color || '#666666',
      textColor: data.textColor || '#FFFFFF',
      isActive: true,
      sortOrder: maxSortOrder + 1,
    };
    const updated = [...activities, newActivity];
    saveActivitiesMutation.mutate(updated);
    return newActivity;
  }, [activities, saveActivitiesMutation]);

  const updateActivity = useCallback((id: string, updates: Partial<Activity>) => {
    const updated = activities.map(a => {
      if (a.id !== id) return a;
      const newCode = updates.code ? updates.code.toUpperCase().slice(0, 3) : a.code;
      const erPoints = getErPointsForCode(newCode);
      return { ...a, ...updates, code: newCode, erPoints };
    });
    saveActivitiesMutation.mutate(updated);
  }, [activities, saveActivitiesMutation]);

  const deleteActivity = useCallback((id: string) => {
    const activeCount = activities.filter(a => a.isActive && a.id !== id).length;
    if (activeCount < 3) {
      return { success: false, error: 'Must keep at least 3 active activities' };
    }
    const updated = activities.filter(a => a.id !== id);
    saveActivitiesMutation.mutate(updated);
    return { success: true };
  }, [activities, saveActivitiesMutation]);

  const toggleActive = useCallback((id: string) => {
    const activity = activities.find(a => a.id === id);
    if (!activity) return { success: false, error: 'Activity not found' };
    
    if (activity.isActive) {
      const activeCount = activities.filter(a => a.isActive && a.id !== id).length;
      if (activeCount < 3) {
        return { success: false, error: 'Must keep at least 3 active activities' };
      }
    }
    
    const updated = activities.map(a => 
      a.id === id ? { ...a, isActive: !a.isActive } : a
    );
    saveActivitiesMutation.mutate(updated);
    return { success: true };
  }, [activities, saveActivitiesMutation]);

  const reorderActivities = useCallback((fromIndex: number, toIndex: number) => {
    const sorted = [...activities].sort((a, b) => a.sortOrder - b.sortOrder);
    const [moved] = sorted.splice(fromIndex, 1);
    sorted.splice(toIndex, 0, moved);
    
    const updated = sorted.map((a, i) => ({ ...a, sortOrder: i }));
    saveActivitiesMutation.mutate(updated);
  }, [activities, saveActivitiesMutation]);

  const moveUp = useCallback((id: string) => {
    const sorted = [...activities].sort((a, b) => a.sortOrder - b.sortOrder);
    const index = sorted.findIndex(a => a.id === id);
    if (index > 0) {
      reorderActivities(index, index - 1);
    }
  }, [activities, reorderActivities]);

  const moveDown = useCallback((id: string) => {
    const sorted = [...activities].sort((a, b) => a.sortOrder - b.sortOrder);
    const index = sorted.findIndex(a => a.id === id);
    if (index < sorted.length - 1) {
      reorderActivities(index, index + 1);
    }
  }, [activities, reorderActivities]);

  const isCodeUnique = useCallback((code: string, excludeId?: string): boolean => {
    const upperCode = code.toUpperCase();
    return !activities.some(a => a.code.toUpperCase() === upperCode && a.id !== excludeId);
  }, [activities]);

  const getActivityPoints = useCallback((codeOrId: string): number => {
    const activity = activities.find(a => a.code === codeOrId || a.id === codeOrId);
    return activity?.points ?? 0;
  }, [activities]);

  const getActivityErPoints = useCallback((codeOrId: string): number => {
    const activity = activities.find(a => a.code === codeOrId || a.id === codeOrId);
    if (activity) {
      return activity.erPoints ?? getErPointsForCode(activity.code);
    }
    return getErPointsForCode(codeOrId);
  }, [activities]);

  const getActivityColor = useCallback((codeOrId: string): { color: string; textColor: string } => {
    const activity = activities.find(a => a.code === codeOrId || a.id === codeOrId);
    return {
      color: activity?.color ?? '#666666',
      textColor: activity?.textColor ?? '#FFFFFF',
    };
  }, [activities]);

  const getActivityLabel = useCallback((codeOrId: string): string => {
    const activity = activities.find(a => a.code === codeOrId || a.id === codeOrId);
    return activity?.name ?? codeOrId;
  }, [activities]);

  return {
    activities,
    activeActivities,
    sortedActivities,
    isLoading: activitiesQuery.isLoading,
    getActivityByCode,
    getActivityById,
    getActivityPoints,
    getActivityErPoints,
    getActivityColor,
    getActivityLabel,
    addActivity,
    updateActivity,
    deleteActivity,
    toggleActive,
    reorderActivities,
    moveUp,
    moveDown,
    isCodeUnique,
  };
});

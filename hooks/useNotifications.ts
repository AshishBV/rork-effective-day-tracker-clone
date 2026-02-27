import { useEffect, useRef, useCallback } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useData } from '../contexts/DataContext';
import { useActivities } from '../contexts/ActivitiesContext';
import { getPreviousSlotIndex, getCurrentSlotIndex, getDateKey, calculateTotalSlots } from '../utils/timeUtils';
import {
  scheduleQuickLogNotifications,
  scheduleDailyReminderNotification,
  addNotificationResponseListener,
  scheduleStrictModeFollowUp,
  cancelNotification,
  requestPermissionsOnFirstLaunch,
} from '../utils/notifications';
import { DEFAULT_TIME_SETTINGS } from '../types/data';

export function useNotifications() {
  const queryClient = useQueryClient();
  const { settings, updateSlot, getSelectedDay, getActiveHabits, getDayByDate, selectedDate, days } = useData();
  const { activeActivities, getActivityByCode } = useActivities();
  const appState = useRef(AppState.currentState);
  const followUpIds = useRef<Map<number, string>>(new Map());
  const hasRequestedPermission = useRef(false);
  const hasScheduledInitial = useRef(false);
  const rescheduleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const timeSettings = settings.timeSettings || DEFAULT_TIME_SETTINGS;
  const activityCodes = activeActivities.map(a => a.code);

  useEffect(() => {
    if (Platform.OS === 'web' || hasRequestedPermission.current) return;
    hasRequestedPermission.current = true;
    requestPermissionsOnFirstLaunch();
  }, []);

  const handleNotificationResponse = useCallback((response: any) => {
    const parsedAction = response?._parsedAction;

    if (parsedAction?.type === 'quick_log' && parsedAction.activityCode) {
      const code = parsedAction.activityCode;
      const activity = getActivityByCode(code);

      if (!activity) {
        console.log(`[Notifications] Unknown activity code: ${code}`);
        return;
      }

      const todayKey = getDateKey(new Date());
      let targetSlotIndex: number;

      if (parsedAction.slotIndex !== undefined && parsedAction.slotIndex !== null) {
        targetSlotIndex = parsedAction.slotIndex;
      } else {
        const currentSlotIndex = getCurrentSlotIndex(timeSettings);
        targetSlotIndex = currentSlotIndex > 0 ? currentSlotIndex - 1 : currentSlotIndex;
      }

      const totalSlots = calculateTotalSlots(timeSettings);
      if (targetSlotIndex < 0 || targetSlotIndex >= totalSlots) {
        console.log(`[Notifications] Slot index ${targetSlotIndex} out of range (0-${totalSlots - 1})`);
        return;
      }

      console.log(`[Notifications] ✓ Logged ${code} (${activity.name}) for slot ${targetSlotIndex} on ${todayKey} | ER points: ${activity.erPoints}`);
      console.log('[Notifications] Data was saved directly to AsyncStorage + Supabase by the response listener');

      queryClient.invalidateQueries({ queryKey: ['days'] });

      const followUpId = followUpIds.current.get(targetSlotIndex);
      if (followUpId) {
        cancelNotification(followUpId);
        followUpIds.current.delete(targetSlotIndex);
        console.log(`[Notifications] Cancelled follow-up for slot ${targetSlotIndex}`);
      }

      return;
    }

    const actionId = response?.actionIdentifier;
    const data = response?.notification?.request?.content?.data;
    console.log('[Notifications] Unhandled action:', actionId, data);
  }, [timeSettings, getActivityByCode, queryClient]);

  const scheduleFollowUpIfNeeded = useCallback(async () => {
    if (!settings.strictMode || Platform.OS === 'web') return;

    const currentDay = getSelectedDay();
    const prevSlotIndex = getPreviousSlotIndex(timeSettings);

    if (prevSlotIndex >= 0) {
      const slot = currentDay.slots[prevSlotIndex];
      if (!slot.activityCategory && !followUpIds.current.has(prevSlotIndex)) {
        const id = await scheduleStrictModeFollowUp(slot.timeIn, slot.timeOut);
        if (id) {
          followUpIds.current.set(prevSlotIndex, id);
        }
      }
    }
  }, [settings.strictMode, getSelectedDay, timeSettings]);

  const shouldStopNotifications = useCallback((): boolean => {
    if (!settings.stopWhenComplete) return false;

    const todayKey = getDateKey(new Date());
    const dayData = getDayByDate(todayKey);
    const totalSlots = calculateTotalSlots(timeSettings);
    const filledSlots = dayData.slots.filter(s => s.activityCategory !== null).length;

    if (filledSlots >= totalSlots) {
      console.log('[Notifications] All slots logged — stopping notifications');
      return true;
    }
    return false;
  }, [settings.stopWhenComplete, getDayByDate, timeSettings]);

  const rescheduleNotifications = useCallback(async () => {
    if (Platform.OS === 'web') return;

    const stop = shouldStopNotifications();

    await scheduleQuickLogNotifications(
      timeSettings.slotDuration,
      timeSettings.dayStartHour,
      timeSettings.dayStartMinute,
      timeSettings.dayEndHour,
      timeSettings.dayEndMinute,
      settings.quietHoursStart,
      settings.quietHoursEnd,
      stop ? false : settings.notificationsEnabled,
      activityCodes
    );

    const activeHabits = getActiveHabits();
    const todayKey = getDateKey(new Date());
    const dayData = getDayByDate(todayKey);

    const pendingHabits = activeHabits
      .filter(h => !dayData.habitCompletions?.[h.id])
      .map(h => h.name);

    const pendingTodos = dayData.todos
      .filter(t => t.text && !t.completed)
      .map(t => t.text);

    await scheduleDailyReminderNotification(
      pendingHabits,
      pendingTodos,
      settings.dailyReminderEnabled ?? true
    );
  }, [
    timeSettings,
    settings.quietHoursStart,
    settings.quietHoursEnd,
    settings.notificationsEnabled,
    settings.dailyReminderEnabled,
    settings.stopWhenComplete,
    activityCodes,
    getActiveHabits,
    getDayByDate,
    shouldStopNotifications,
  ]);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const subscription = addNotificationResponseListener(handleNotificationResponse);

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [handleNotificationResponse]);

  const debouncedReschedule = useCallback(() => {
    if (rescheduleTimer.current) {
      clearTimeout(rescheduleTimer.current);
    }
    rescheduleTimer.current = setTimeout(() => {
      rescheduleNotifications();
      rescheduleTimer.current = null;
    }, 1000);
  }, [rescheduleNotifications]);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('[Notifications] App came to foreground — forcing data reload from AsyncStorage');
        queryClient.invalidateQueries({ queryKey: ['days'] });

        debouncedReschedule();

        if (settings.strictMode) {
          scheduleFollowUpIfNeeded();
        }
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    if (!hasScheduledInitial.current) {
      hasScheduledInitial.current = true;
      rescheduleNotifications();
    }

    return () => {
      subscription.remove();
      if (rescheduleTimer.current) {
        clearTimeout(rescheduleTimer.current);
      }
    };
  }, [rescheduleNotifications, debouncedReschedule, settings.strictMode, scheduleFollowUpIfNeeded]);

  useEffect(() => {
    if (settings.strictMode && Platform.OS !== 'web') {
      const interval = setInterval(() => {
        scheduleFollowUpIfNeeded();
      }, 60000);

      return () => clearInterval(interval);
    }
  }, [settings.strictMode, scheduleFollowUpIfNeeded]);

  return {
    rescheduleNotifications,
  };
}

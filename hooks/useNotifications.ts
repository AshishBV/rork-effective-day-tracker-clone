import { useEffect, useRef, useCallback, useMemo } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import { useData } from '../contexts/DataContext';
import { useActivities } from '../contexts/ActivitiesContext';
import { getPreviousSlotIndex, getDateKey, calculateTotalSlots } from '../utils/timeUtils';
import {
  scheduleQuickLogNotifications,
  scheduleDailyReminderNotification,
  scheduleWeeklyReportNotification,
  scheduleStrictModeFollowUp,
  cancelNotification,
  requestPermissionsOnFirstLaunch,
} from '../utils/notifications';
import { DEFAULT_TIME_SETTINGS } from '../types/data';

export function useNotifications() {
  const { settings, getActiveHabits, getDayByDate, getSelectedDay, days } = useData();
  const { activeActivities } = useActivities();
  const appState = useRef(AppState.currentState);
  const followUpIds = useRef<Map<number, string>>(new Map());
  const hasRequestedPermission = useRef(false);
  const hasScheduledInitial = useRef(false);
  const rescheduleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const timeSettings = settings.timeSettings || DEFAULT_TIME_SETTINGS;
  const activityCodes = activeActivities.map(a => a.code);

  const effectiveFrequencyMinutes = useMemo(() => {
    const freq = settings.notificationFrequency ?? 15;
    if (freq === 'custom') return settings.customNotificationMinutes ?? 45;
    return freq;
  }, [settings.notificationFrequency, settings.customNotificationMinutes]);

  useEffect(() => {
    if (Platform.OS === 'web' || hasRequestedPermission.current) return;
    hasRequestedPermission.current = true;
    requestPermissionsOnFirstLaunch();
  }, []);

  const shouldStopNotifications = useCallback((): boolean => {
    if (!settings.stopWhenComplete) return false;

    const todayKey = getDateKey(new Date());
    const dayData = getDayByDate(todayKey);
    const totalSlots = calculateTotalSlots(timeSettings);
    const filledSlots = dayData.slots.filter(s => s.activityCategory !== null).length;

    if (filledSlots >= totalSlots) {
      console.log('[useNotifications] All slots logged — stopping notifications');
      return true;
    }
    return false;
  }, [settings.stopWhenComplete, getDayByDate, timeSettings]);

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

    try {
      await scheduleWeeklyReportNotification(
        days,
        activeHabits.map(h => ({ id: h.id, name: h.name })),
        settings.erGoal,
        settings.notificationsEnabled
      );
    } catch (e) {
      console.log('[useNotifications] Weekly report scheduling failed:', e);
    }
  }, [
    effectiveFrequencyMinutes,
    timeSettings,
    settings.quietHoursStart,
    settings.quietHoursEnd,
    settings.notificationsEnabled,
    settings.notificationFrequency,
    settings.dailyReminderEnabled,
    settings.stopWhenComplete,
    activityCodes,
    getActiveHabits,
    getDayByDate,
    days,
    settings.erGoal,
    shouldStopNotifications,
  ]);

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
        console.log('[useNotifications] App came to foreground — rescheduling');
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

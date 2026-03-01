import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { notificationEvents } from './notificationEvents';

let Notifications: any = null;
let notificationsReady = false;
let responseListenerActive = false;
let backgroundTaskRegistered = false;

const QUICK_LOG_CHANNEL_ID = 'quick-log-reminders';
const DAILY_REMINDER_CHANNEL_ID = 'daily-reminder';
const SCHEDULED_IDS_KEY = 'scheduled_notification_ids';
const DAILY_REMINDER_ID_KEY = 'daily_reminder_notification_id';
const PERMISSION_REQUESTED_KEY = 'notification_permission_requested';
const DAYS_STORAGE_KEY = 'effective_day_tracker_days';
const SETTINGS_STORAGE_KEY = 'effective_day_tracker_settings';

let isSchedulingInProgress = false;

async function isSlotAlreadyFilled(date: string, slotIndex: number): Promise<boolean> {
  try {
    const stored = await AsyncStorage.getItem(DAYS_STORAGE_KEY);
    if (!stored) return false;
    const days = JSON.parse(stored);
    const day = days[date];
    if (!day?.slots?.[slotIndex]) return false;
    return day.slots[slotIndex].activityCategory != null;
  } catch (e) {
    console.log('[Notifications] Error checking slot status:', e);
    return false;
  }
}

function getCurrentDateKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

async function loadNotificationsModule(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  if (Notifications !== null) return notificationsReady;

  try {
    Notifications = await import('expo-notifications') as any;
    Notifications.setNotificationHandler({
      handleNotification: async (notification: any) => {
        const data = notification.request.content.data;
        if (data?.type === 'quick_log' && typeof data?.slotIndex === 'number') {
          const todayKey = getCurrentDateKey();
          const filled = await isSlotAlreadyFilled(todayKey, data.slotIndex as number);
          if (filled) {
            console.log(`[Notifications] Slot ${data.slotIndex} on ${todayKey} already filled — suppressing notification`);
            return {
              shouldShowAlert: false,
              shouldPlaySound: false,
              shouldSetBadge: false,
              shouldShowBanner: false,
              shouldShowList: false,
              priority: (Notifications as any).AndroidNotificationPriority?.LOW,
            };
          }
        }
        return {
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
          priority: (Notifications as any).AndroidNotificationPriority?.HIGH,
        };
      },
    });
    notificationsReady = true;
    console.log('[Notifications] Module loaded');
    return true;
  } catch (error) {
    console.log('[Notifications] Module not available:', error);
    notificationsReady = false;
    return false;
  }
}


export async function handleNotificationAction(actionId: string, data: Record<string, unknown> | undefined): Promise<void> {
  console.log('[Notifications] handleNotificationAction:', actionId, JSON.stringify(data));

  if (actionId === 'SELECT_RANGE') {
    console.log('[Notifications] Opening range-log screen');
    try {
      router.push('/range-log' as any);
    } catch (e) {
      console.log('[Notifications] Could not navigate to range-log:', e);
    }
    return;
  }

  if (actionId.startsWith('LOG_')) {
    const activityCode = actionId.replace('LOG_', '');
    const slotIndex = data?.slotIndex as number | undefined;
    const dateKey = getCurrentDateKey();

    console.log(`[Notifications] Action LOG: code=${activityCode}, slot=${slotIndex}, date=${dateKey}`);

    try {
      const notifModule = Notifications || await import('expo-notifications') as any;
      await notifModule.dismissAllNotificationsAsync();
      console.log('[Notifications] Dismissed all notifications after action');
    } catch (e) {
      console.log('[Notifications] dismissAllNotificationsAsync error:', e);
    }

    if (typeof slotIndex === 'number') {
      const saved = await saveSlotToStorage(dateKey, slotIndex, activityCode);
      console.log(`[Notifications] Save result: ${saved}`);
      notificationEvents.emit();
    } else {
      console.log('[Notifications] No slotIndex in notification data, cannot save');
    }
    return;
  }

  console.log('[Notifications] Unhandled action:', actionId);
}

export const NOTIFICATION_ACTION_TASK = 'NOTIFICATION_ACTION_TASK';

export async function registerBackgroundNotificationTask(): Promise<void> {
  if (Platform.OS === 'web') return;
  if (backgroundTaskRegistered) {
    console.log('[Notifications] Background task already registered');
    return;
  }

  const nLoaded = await loadNotificationsModule();
  if (!nLoaded || !Notifications) {
    console.log('[Notifications] Cannot register background task — notifications unavailable');
    return;
  }

  try {
    await Notifications.registerTaskAsync(NOTIFICATION_ACTION_TASK);
    backgroundTaskRegistered = true;
    console.log('[Notifications] Background task registered successfully with task:', NOTIFICATION_ACTION_TASK);
  } catch (e: any) {
    if (e?.message?.includes('already registered')) {
      backgroundTaskRegistered = true;
      console.log('[Notifications] Background task was already registered');
    } else {
      console.error('[Notifications] Failed to register background task:', e);
    }
  }
}

function getTodayDateKey(): string {
  return getCurrentDateKey();
}

function generateTimeSlotsForDay(timeSettings: {
  slotDuration: number;
  dayStartHour: number;
  dayStartMinute: number;
  dayEndHour: number;
  dayEndMinute: number;
}): Array<{
  index: number;
  timeIn: string;
  timeOut: string;
  activityCategory: string | null;
  plannedCategory: string | null;
  performedActivityText: string;
  pointsOverride: number | null;
}> {
  const slots: Array<{
    index: number;
    timeIn: string;
    timeOut: string;
    activityCategory: string | null;
    plannedCategory: string | null;
    performedActivityText: string;
    pointsOverride: number | null;
  }> = [];
  const startMinutes = timeSettings.dayStartHour * 60 + timeSettings.dayStartMinute;
  const endMinutes = timeSettings.dayEndHour * 60 + timeSettings.dayEndMinute;
  let idx = 0;
  for (let m = startMinutes; m < endMinutes; m += timeSettings.slotDuration) {
    const endM = m + timeSettings.slotDuration;
    const timeIn = `${Math.floor(m / 60).toString().padStart(2, '0')}:${(m % 60).toString().padStart(2, '0')}`;
    const timeOut = `${Math.floor(endM / 60).toString().padStart(2, '0')}:${(endM % 60).toString().padStart(2, '0')}`;
    slots.push({
      index: idx,
      timeIn,
      timeOut,
      activityCategory: null,
      plannedCategory: null,
      performedActivityText: '',
      pointsOverride: null,
    });
    idx++;
  }
  return slots;
}

async function getTimeSettings(): Promise<{
  slotDuration: number;
  dayStartHour: number;
  dayStartMinute: number;
  dayEndHour: number;
  dayEndMinute: number;
}> {
  try {
    const stored = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
    if (stored) {
      const settings = JSON.parse(stored);
      if (settings?.timeSettings) {
        return settings.timeSettings;
      }
    }
  } catch (e) {
    console.log('[Notifications] Could not read time settings:', e);
  }
  return {
    slotDuration: 15,
    dayStartHour: 5,
    dayStartMinute: 0,
    dayEndHour: 23,
    dayEndMinute: 0,
  };
}

async function saveSlotToStorage(dateKey: string, slotIndex: number, activityCode: string): Promise<boolean> {
  try {
    console.log(`[Notifications] saveSlotToStorage: date=${dateKey}, slot=${slotIndex}, activity=${activityCode}`);
    const stored = await AsyncStorage.getItem(DAYS_STORAGE_KEY);
    const days: Record<string, any> = stored ? JSON.parse(stored) : {};

    if (!days[dateKey]) {
      const timeSettings = await getTimeSettings();
      const slots = generateTimeSlotsForDay(timeSettings);
      days[dateKey] = {
        date: dateKey,
        slots,
        habits: [false, false, false, false, false],
        habitCompletions: {},
        todos: Array(5).fill(null).map(() => ({ text: '', completed: false })),
        gratitude: ['', '', ''],
        highlights: ['', '', '', '', ''],
        sleepHours: null,
        steps: null,
      };
      console.log(`[Notifications] Created new day for ${dateKey} with ${slots.length} slots`);
    }

    const day = days[dateKey];
    if (slotIndex < 0 || slotIndex >= day.slots.length) {
      console.log(`[Notifications] Slot index ${slotIndex} out of range (max: ${day.slots.length - 1})`);
      return false;
    }

    day.slots[slotIndex] = {
      ...day.slots[slotIndex],
      activityCategory: activityCode,
    };
    days[dateKey] = day;

    await AsyncStorage.setItem(DAYS_STORAGE_KEY, JSON.stringify(days));
    console.log(`[Notifications] Saved ${activityCode} to slot ${slotIndex} on ${dateKey}`);

    try {
      const { debouncedUpsert, isSupabaseConfigured } = await import('../lib/supabase');
      if (isSupabaseConfigured()) {
        debouncedUpsert('days', days);
        console.log('[Notifications] Triggered Supabase sync');
      }
    } catch (e) {
      console.log('[Notifications] Supabase sync failed (non-critical):', e);
    }

    return true;
  } catch (e) {
    console.error('[Notifications] saveSlotToStorage failed:', e);
    return false;
  }
}

export async function initializeRootNotificationListener(): Promise<(() => void) | null> {
  if (Platform.OS === 'web') return null;
  if (responseListenerActive) {
    console.log('[Notifications] Root listener already active, skipping');
    return null;
  }

  const available = await loadNotificationsModule();
  if (!available || !Notifications) {
    console.log('[Notifications] Cannot init root listener - module unavailable');
    return null;
  }

  await registerBackgroundNotificationTask();

  responseListenerActive = true;
  console.log('[Notifications] Setting up ROOT notification response listener (foreground)');

  const subscription = Notifications.addNotificationResponseReceivedListener(async (response: any) => {
    const actionId = response.actionIdentifier;
    const data = response.notification.request.content.data as Record<string, unknown> | undefined;

    console.log('[Notifications] FOREGROUND handler received action:', actionId);
    console.log('[Notifications] FOREGROUND handler data:', JSON.stringify(data));

    if (Notifications && actionId === Notifications.DEFAULT_ACTION_IDENTIFIER) {
      console.log('[Notifications] Default tap (opened app from notification)');
      return;
    }

    await handleNotificationAction(actionId, data);
  });

  console.log('[Notifications] ROOT foreground listener active');

  return () => {
    responseListenerActive = false;
    subscription.remove();
    console.log('[Notifications] ROOT listener removed');
  };
}

export async function setupNotificationChannels(): Promise<void> {
  if (Platform.OS === 'web') return;
  const available = await loadNotificationsModule();
  if (!available || !Notifications) return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(QUICK_LOG_CHANNEL_ID, {
      name: 'Quick Log Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF6B35',
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync(DAILY_REMINDER_CHANNEL_ID, {
      name: 'Daily Reminder',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4CAF50',
      sound: 'default',
    });
  }
  console.log('[Notifications] Channels set up');
}

export async function requestPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  const available = await loadNotificationsModule();
  if (!available || !Notifications) return false;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('[Notifications] Permission not granted');
    return false;
  }

  console.log('[Notifications] Permission granted');
  return true;
}

export async function requestPermissionsOnFirstLaunch(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  const alreadyRequested = await AsyncStorage.getItem(PERMISSION_REQUESTED_KEY);
  if (alreadyRequested === 'true') return false;

  await AsyncStorage.setItem(PERMISSION_REQUESTED_KEY, 'true');
  return await requestPermissions();
}

export async function cancelAllQuickLogNotifications(): Promise<void> {
  try {
    const available = await loadNotificationsModule();
    if (!available || !Notifications) return;

    const allScheduled = await Notifications.getAllScheduledNotificationsAsync();
    let cancelledCount = 0;
    for (const notif of allScheduled) {
      const type = notif.content?.data?.type;
      if (type === 'quick_log') {
        await Notifications.cancelScheduledNotificationAsync(notif.identifier);
        cancelledCount++;
      }
    }
    console.log(`[Notifications] Cancelled ${cancelledCount} quick_log notifications`);

    const storedIds = await AsyncStorage.getItem(SCHEDULED_IDS_KEY);
    if (storedIds) {
      const ids: string[] = JSON.parse(storedIds);
      for (const id of ids) {
        try {
          await Notifications.cancelScheduledNotificationAsync(id);
        } catch (_) {}
      }
    }
    await AsyncStorage.setItem(SCHEDULED_IDS_KEY, JSON.stringify([]));
  } catch (error) {
    console.error('[Notifications] Error cancelling notifications:', error);
  }
}

export async function scheduleQuickLogNotifications(
  slotDuration: number,
  dayStartHour: number,
  dayStartMinute: number,
  dayEndHour: number,
  dayEndMinute: number,
  quietStart: string,
  quietEnd: string,
  enabled: boolean,
  activityCodes: string[]
): Promise<void> {
  if (Platform.OS === 'web') return;

  if (isSchedulingInProgress) {
    console.log('[Notifications] Scheduling already in progress');
    return;
  }
  isSchedulingInProgress = true;

  try {
    await cancelAllQuickLogNotifications();

    if (!enabled) {
      console.log('[Notifications] Notifications disabled');
      return;
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    if (!Notifications) return;

    await setupNotificationChannels();

    const [quietStartHour, quietStartMin] = quietStart.split(':').map(Number);
    const [quietEndHour, quietEndMin] = quietEnd.split(':').map(Number);
    const quietStartMinutes = quietStartHour * 60 + quietStartMin;
    const quietEndMinutes = quietEndHour * 60 + quietEndMin;

    const scheduledIds: string[] = [];
    const now = new Date();
    const todayDateKey = getTodayDateKey();
    const startMinutes = dayStartHour * 60 + dayStartMinute;
    const endMinutes = dayEndHour * 60 + dayEndMinute;

    const group1Codes = activityCodes.slice(0, 3);
    const group2Codes = activityCodes.slice(3);

    const group1Actions = group1Codes.map(code => ({
      identifier: `LOG_${code}`,
      buttonTitle: code,
      options: { opensAppToForeground: true },
    }));

    const group2Actions = group2Codes.map(code => ({
      identifier: `LOG_${code}`,
      buttonTitle: code,
      options: { opensAppToForeground: true },
    }));

    await Notifications.setNotificationCategoryAsync('QUICK_LOG_1', group1Actions);
    await Notifications.setNotificationCategoryAsync('QUICK_LOG_2', group2Actions);
    console.log('[Notifications] Categories: QUICK_LOG_1=[' + group1Codes.join(',') + '], QUICK_LOG_2=[' + group2Codes.join(',') + ']');

    for (let minutes = startMinutes; minutes < endMinutes; minutes += slotDuration) {
      const isInQuietHours = quietEndMinutes < quietStartMinutes
        ? (minutes >= quietStartMinutes || minutes < quietEndMinutes)
        : (minutes >= quietStartMinutes && minutes < quietEndMinutes);

      if (isInQuietHours) continue;

      const slotHour = Math.floor(minutes / 60);
      const slotMinute = minutes % 60;
      const slotEndMinutes = minutes + slotDuration;
      const slotEndHour = Math.floor(slotEndMinutes / 60);
      const slotEndMin = slotEndMinutes % 60;

      const timeIn = `${slotHour.toString().padStart(2, '0')}:${slotMinute.toString().padStart(2, '0')}`;
      const timeOut = `${slotEndHour.toString().padStart(2, '0')}:${slotEndMin.toString().padStart(2, '0')}`;
      const slotIndex = Math.floor((minutes - startMinutes) / slotDuration);

      const triggerDate = new Date(now);
      triggerDate.setHours(slotHour, slotMinute, 0, 0);
      if (triggerDate <= now) {
        triggerDate.setDate(triggerDate.getDate() + 1);
      }

      const commonData = {
        type: 'quick_log' as const,
        timeIn,
        timeOut,
        slotMinutes: minutes,
        slotIndex,
        date: todayDateKey,
        activityCodes: activityCodes,
      };

      try {
        const id1 = await Notifications.scheduleNotificationAsync({
          content: {
            title: `Log: ${group1Codes.join(', ')}`,
            body: `${timeIn} → ${timeOut}`,
            data: { ...commonData, group: 1 },
            categoryIdentifier: 'QUICK_LOG_1',
            sound: 'default',
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: slotHour,
            minute: slotMinute,
          },
        });
        scheduledIds.push(id1);

        const id2 = await Notifications.scheduleNotificationAsync({
          content: {
            title: `Log: ${group2Codes.join(', ')}`,
            body: `${timeIn} → ${timeOut}`,
            data: { ...commonData, group: 2 },
            categoryIdentifier: 'QUICK_LOG_2',
            sound: undefined,
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: slotHour,
            minute: slotMinute,
          },
        });
        scheduledIds.push(id2);
      } catch (error) {
        console.error(`[Notifications] Failed to schedule for ${timeIn}:`, error);
      }
    }

    await AsyncStorage.setItem(SCHEDULED_IDS_KEY, JSON.stringify(scheduledIds));
    console.log(`[Notifications] Scheduled ${scheduledIds.length} notifications`);
  } finally {
    isSchedulingInProgress = false;
  }
}

async function cancelDailyReminder(): Promise<void> {
  try {
    const available = await loadNotificationsModule();
    if (!available || !Notifications) return;
    const storedId = await AsyncStorage.getItem(DAILY_REMINDER_ID_KEY);
    if (storedId) {
      await Notifications.cancelScheduledNotificationAsync(storedId);
      await AsyncStorage.removeItem(DAILY_REMINDER_ID_KEY);
    }
  } catch (error) {
    console.error('[Notifications] Error cancelling daily reminder:', error);
  }
}

export async function scheduleDailyReminderNotification(
  pendingHabits: string[],
  pendingTodos: string[],
  enabled: boolean
): Promise<void> {
  if (Platform.OS === 'web') return;

  const available = await loadNotificationsModule();
  if (!available || !Notifications) return;

  await cancelDailyReminder();

  if (!enabled) return;

  const hasPermission = await requestPermissions();
  if (!hasPermission) return;

  await setupNotificationChannels();

  let body = '';
  if (pendingHabits.length === 0 && pendingTodos.length === 0) {
    body = 'All done for today. Great job!';
  } else {
    const parts: string[] = [];
    if (pendingHabits.length > 0) parts.push(`Habits: ${pendingHabits.join(', ')}`);
    if (pendingTodos.length > 0) parts.push(`To-dos: ${pendingTodos.join(', ')}`);
    body = parts.join('\n');
  }

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '8 PM Daily Reminder',
        body,
        data: { type: 'daily_reminder' },
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 20,
        minute: 0,
      },
    });
    await AsyncStorage.setItem(DAILY_REMINDER_ID_KEY, id);
    console.log('[Notifications] Daily reminder scheduled');
  } catch (error) {
    console.error('[Notifications] Failed to schedule daily reminder:', error);
  }
}

export async function cancelNotification(id: string): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const available = await loadNotificationsModule();
    if (!available || !Notifications) return;
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch (error) {
    console.error('[Notifications] Failed to cancel notification:', error);
  }
}

export async function scheduleStrictModeFollowUp(
  timeIn: string,
  timeOut: string
): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  const hasPermission = await requestPermissions();
  if (!hasPermission || !Notifications) return null;

  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Slot still unlogged',
        body: `${timeIn}–${timeOut} is still empty. Log it now!`,
        data: { type: 'strict_mode', timeIn, timeOut },
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 300,
      },
    });
    return id;
  } catch (error) {
    console.error('[Notifications] Failed to schedule strict mode follow-up:', error);
    return null;
  }
}

export function getCurrentSlotFromTime(
  slotDuration: number,
  dayStartHour: number,
  dayStartMinute: number
): { slotIndex: number; timeIn: string; timeOut: string } {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = dayStartHour * 60 + dayStartMinute;

  const minutesSinceStart = currentMinutes - startMinutes;
  const slotIndex = Math.floor(minutesSinceStart / slotDuration);

  const slotStartMinutes = startMinutes + slotIndex * slotDuration;
  const slotEndMinutes = slotStartMinutes + slotDuration;

  const timeIn = `${Math.floor(slotStartMinutes / 60).toString().padStart(2, '0')}:${(slotStartMinutes % 60).toString().padStart(2, '0')}`;
  const timeOut = `${Math.floor(slotEndMinutes / 60).toString().padStart(2, '0')}:${(slotEndMinutes % 60).toString().padStart(2, '0')}`;

  return { slotIndex, timeIn, timeOut };
}

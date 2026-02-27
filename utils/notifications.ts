import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

let Notifications: typeof import('expo-notifications') | null = null;
let notificationsAvailable = false;

const QUICK_LOG_CHANNEL_ID = 'quick-log-reminders';
const DAILY_REMINDER_CHANNEL_ID = 'daily-reminder';
const SCHEDULED_IDS_KEY = 'scheduled_notification_ids';
const DAILY_REMINDER_ID_KEY = 'daily_reminder_notification_id';
const PERMISSION_REQUESTED_KEY = 'notification_permission_requested';

let isSchedulingInProgress = false;

async function initializeNotifications(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  if (Notifications !== null) return notificationsAvailable;

  try {
    Notifications = await import('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
        priority: Notifications!.AndroidNotificationPriority.HIGH,
      }),
    });
    notificationsAvailable = true;
    console.log('[Notifications] Module loaded successfully');
    return true;
  } catch (error) {
    console.log('[Notifications] Module not available:', error);
    notificationsAvailable = false;
    return false;
  }
}

export async function setupNotificationChannels(): Promise<void> {
  if (Platform.OS === 'web') return;
  const available = await initializeNotifications();
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
  if (Platform.OS === 'web') {
    console.log('[Notifications] Web platform - skipping permission request');
    return false;
  }

  const available = await initializeNotifications();
  if (!available || !Notifications) {
    console.log('[Notifications] Module not available - skipping permission request');
    return false;
  }

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
  if (alreadyRequested === 'true') {
    console.log('[Notifications] Permission already requested on first launch');
    return false;
  }

  await AsyncStorage.setItem(PERMISSION_REQUESTED_KEY, 'true');
  const granted = await requestPermissions();
  console.log(`[Notifications] First launch permission request: ${granted ? 'granted' : 'denied'}`);
  return granted;
}

export async function cancelAllQuickLogNotifications(): Promise<void> {
  try {
    const available = await initializeNotifications();
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
    console.log(`[Notifications] Cancelled ${cancelledCount} quick_log notifications (found ${allScheduled.length} total scheduled)`);

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
  if (Platform.OS === 'web') {
    console.log('[Notifications] Web platform - skipping scheduling');
    return;
  }

  if (isSchedulingInProgress) {
    console.log('[Notifications] Scheduling already in progress - skipping');
    return;
  }
  isSchedulingInProgress = true;

  try {
    await _scheduleQuickLogNotificationsInner(
      slotDuration, dayStartHour, dayStartMinute, dayEndHour, dayEndMinute,
      quietStart, quietEnd, enabled, activityCodes
    );
  } finally {
    isSchedulingInProgress = false;
  }
}

async function _scheduleQuickLogNotificationsInner(
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
  await cancelAllQuickLogNotifications();

  if (!enabled) {
    console.log('[Notifications] Notifications disabled - not scheduling');
    return;
  }

  const hasPermission = await requestPermissions();
  if (!hasPermission) {
    console.log('[Notifications] No permission - not scheduling');
    return;
  }

  if (!Notifications) {
    console.log('[Notifications] Module not available - cannot schedule');
    return;
  }

  await setupNotificationChannels();

  const [quietStartHour, quietStartMin] = quietStart.split(':').map(Number);
  const [quietEndHour, quietEndMin] = quietEnd.split(':').map(Number);
  const quietStartMinutes = quietStartHour * 60 + quietStartMin;
  const quietEndMinutes = quietEndHour * 60 + quietEndMin;

  const scheduledIds: string[] = [];
  const now = new Date();
  const startMinutes = dayStartHour * 60 + dayStartMinute;
  const endMinutes = dayEndHour * 60 + dayEndMinute;

  const topActions = activityCodes.slice(0, 2).map(code => ({
    identifier: `LOG_${code}`,
    buttonTitle: code,
    options: {
      opensAppToForeground: false,
    },
  }));

  const actions = [
    ...topActions,
    {
      identifier: 'MORE_ACTIVITIES',
      buttonTitle: 'More...',
      options: {
        opensAppToForeground: true,
      },
    },
  ];

  await Notifications.setNotificationCategoryAsync('QUICK_LOG', actions);
  console.log('[Notifications] Set QUICK_LOG category with actions:', actions.map(a => a.identifier).join(', '));

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

    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Log this slot',
          body: `${timeIn} → ${timeOut}`,
          data: {
            type: 'quick_log',
            timeIn,
            timeOut,
            slotMinutes: minutes,
            slotIndex,
          },
          categoryIdentifier: 'QUICK_LOG',
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: slotHour,
          minute: slotMinute,
        },
      });
      scheduledIds.push(id);
    } catch (error) {
      console.error(`[Notifications] Failed to schedule for ${timeIn}:`, error);
    }
  }

  await AsyncStorage.setItem(SCHEDULED_IDS_KEY, JSON.stringify(scheduledIds));
  console.log(`[Notifications] Scheduled ${scheduledIds.length} quick log notifications (${slotDuration}min slots)`);
}

async function cancelDailyReminder(): Promise<void> {
  try {
    const available = await initializeNotifications();
    if (!available || !Notifications) return;
    const storedId = await AsyncStorage.getItem(DAILY_REMINDER_ID_KEY);
    if (storedId) {
      await Notifications.cancelScheduledNotificationAsync(storedId);
      await AsyncStorage.removeItem(DAILY_REMINDER_ID_KEY);
      console.log('[Notifications] Cancelled daily reminder');
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

  const available = await initializeNotifications();
  if (!available || !Notifications) return;

  await cancelDailyReminder();

  if (!enabled) {
    console.log('[Notifications] Daily reminder disabled');
    return;
  }

  const hasPermission = await requestPermissions();
  if (!hasPermission) return;

  await setupNotificationChannels();

  let body = '';
  if (pendingHabits.length === 0 && pendingTodos.length === 0) {
    body = 'All done for today. Great job!';
  } else {
    const parts: string[] = [];
    if (pendingHabits.length > 0) {
      parts.push(`Habits: ${pendingHabits.join(', ')}`);
    }
    if (pendingTodos.length > 0) {
      parts.push(`To-dos: ${pendingTodos.join(', ')}`);
    }
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
    console.log('[Notifications] Daily reminder scheduled for 8 PM');
  } catch (error) {
    console.error('[Notifications] Failed to schedule daily reminder:', error);
  }
}

export async function cancelNotification(id: string): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const available = await initializeNotifications();
    if (!available || !Notifications) return;
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch (error) {
    console.error('[Notifications] Failed to cancel notification:', error);
  }
}

export function addNotificationResponseListener(
  handler: (response: any) => void
): { remove: () => void } | null {
  if (Platform.OS === 'web') return null;

  let subscription: { remove: () => void } | null = null;

  initializeNotifications().then((available) => {
    if (!available || !Notifications) return;

    subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const actionId = response.actionIdentifier;
      const data = response.notification.request.content.data;

      console.log('[Notifications] Response received:', actionId, JSON.stringify(data));

      if (actionId === 'SELECT_RANGE') {
        console.log('[Notifications] Opening range log screen');
        router.push('/range-log' as any);
        return;
      }

      if (actionId === 'MORE_ACTIVITIES') {
        const slotIndex = data?.slotIndex;
        const timeIn = data?.timeIn;
        const timeOut = data?.timeOut;
        console.log(`[Notifications] Opening app for slot ${slotIndex} (${timeIn} - ${timeOut})`);
        router.push('/range-log' as any);
        return;
      }

      if (actionId.startsWith('LOG_')) {
        const activityCode = actionId.replace('LOG_', '');
        console.log(`[Notifications] Quick log action: ${activityCode}, slot data:`, data);
        handler({
          ...response,
          _parsedAction: {
            type: 'quick_log',
            activityCode,
            slotIndex: data?.slotIndex,
            timeIn: data?.timeIn,
            timeOut: data?.timeOut,
            slotMinutes: data?.slotMinutes,
          },
        });
        return;
      }

      if (actionId === Notifications!.DEFAULT_ACTION_IDENTIFIER) {
        console.log('[Notifications] Default tap action, data:', data);
        handler(response);
        return;
      }

      handler(response);
    });
  });

  return {
    remove: () => {
      subscription?.remove();
    },
  };
}

export async function scheduleStrictModeFollowUp(
  timeIn: string,
  timeOut: string
): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  const hasPermission = await requestPermissions();
  if (!hasPermission) return null;

  if (!Notifications) return null;

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

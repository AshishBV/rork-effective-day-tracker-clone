import React, { useMemo, useEffect, useCallback, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TextInput, TouchableOpacity, Platform, Modal, Animated, Pressable, FlatList } from 'react-native';
import { Bell, Clock, Zap, BellOff, CheckCircle, ChevronUp, ChevronDown } from 'lucide-react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { useData } from '../../../contexts/DataContext';
import { useActivities } from '../../../contexts/ActivitiesContext';
import { SHADOWS } from '../../../constants/theme';
import { scheduleQuickLogNotifications, scheduleDailyReminderNotification, requestPermissions } from '../../../utils/notifications';
import { DEFAULT_TIME_SETTINGS, NotificationFrequency } from '../../../types/data';

const FREQUENCY_OPTIONS: { label: string; value: NotificationFrequency }[] = [
  { label: 'Every 15 min', value: 15 },
  { label: 'Every 30 min', value: 30 },
  { label: 'Every 1 hour', value: 60 },
  { label: 'Custom', value: 'custom' },
];

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 15, 30, 45];

function TimePickerModal({
  visible,
  onClose,
  onSave,
  initialHour,
  initialMinute,
  title,
  colors,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (hour: number, minute: number) => void;
  initialHour: number;
  initialMinute: number;
  title: string;
  colors: any;
}) {
  const [hour, setHour] = useState(initialHour);
  const [minute, setMinute] = useState(initialMinute);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setHour(initialHour);
      setMinute(initialMinute);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible, initialHour, initialMinute]);

  const incrementHour = useCallback(() => setHour(h => (h + 1) % 24), []);
  const decrementHour = useCallback(() => setHour(h => (h - 1 + 24) % 24), []);
  const incrementMinute = useCallback(() => {
    setMinute(m => {
      const idx = MINUTES.indexOf(m);
      return MINUTES[(idx + 1) % MINUTES.length];
    });
  }, []);
  const decrementMinute = useCallback(() => {
    setMinute(m => {
      const idx = MINUTES.indexOf(m);
      return MINUTES[(idx - 1 + MINUTES.length) % MINUTES.length];
    });
  }, []);

  const modalStyles = useMemo(() => StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    container: {
      backgroundColor: colors.cardBackground,
      borderRadius: 20,
      padding: 24,
      width: 280,
      alignItems: 'center',
    },
    title: {
      fontSize: 17,
      fontWeight: '600' as const,
      color: colors.primaryText,
      marginBottom: 24,
    },
    pickerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    pickerColumn: {
      alignItems: 'center',
      gap: 6,
    },
    arrowButton: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    valueBox: {
      width: 64,
      height: 56,
      borderRadius: 14,
      backgroundColor: colors.highlight + '18',
      borderWidth: 2,
      borderColor: colors.highlight,
      justifyContent: 'center',
      alignItems: 'center',
    },
    valueText: {
      fontSize: 28,
      fontWeight: '700' as const,
      color: colors.primaryText,
    },
    separator: {
      fontSize: 28,
      fontWeight: '700' as const,
      color: colors.secondaryText,
      marginHorizontal: 4,
    },
    pickerLabel: {
      fontSize: 11,
      color: colors.secondaryText,
      marginTop: 4,
      fontWeight: '500' as const,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 28,
      width: '100%',
    },
    cancelButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: colors.background,
      alignItems: 'center',
    },
    cancelText: {
      fontSize: 15,
      fontWeight: '600' as const,
      color: colors.secondaryText,
    },
    saveButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: colors.highlight,
      alignItems: 'center',
    },
    saveText: {
      fontSize: 15,
      fontWeight: '600' as const,
      color: '#FFFFFF',
    },
  }), [colors]);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable style={modalStyles.overlay} onPress={onClose}>
        <Animated.View style={[modalStyles.container, { opacity: fadeAnim }]}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <Text style={modalStyles.title}>{title}</Text>
            <View style={modalStyles.pickerRow}>
              <View style={modalStyles.pickerColumn}>
                <TouchableOpacity style={modalStyles.arrowButton} onPress={incrementHour}>
                  <ChevronUp size={22} color={colors.primaryText} />
                </TouchableOpacity>
                <View style={modalStyles.valueBox}>
                  <Text style={modalStyles.valueText}>{String(hour).padStart(2, '0')}</Text>
                </View>
                <TouchableOpacity style={modalStyles.arrowButton} onPress={decrementHour}>
                  <ChevronDown size={22} color={colors.primaryText} />
                </TouchableOpacity>
                <Text style={modalStyles.pickerLabel}>HOUR</Text>
              </View>

              <Text style={modalStyles.separator}>:</Text>

              <View style={modalStyles.pickerColumn}>
                <TouchableOpacity style={modalStyles.arrowButton} onPress={incrementMinute}>
                  <ChevronUp size={22} color={colors.primaryText} />
                </TouchableOpacity>
                <View style={modalStyles.valueBox}>
                  <Text style={modalStyles.valueText}>{String(minute).padStart(2, '0')}</Text>
                </View>
                <TouchableOpacity style={modalStyles.arrowButton} onPress={decrementMinute}>
                  <ChevronDown size={22} color={colors.primaryText} />
                </TouchableOpacity>
                <Text style={modalStyles.pickerLabel}>MIN</Text>
              </View>
            </View>

            <View style={modalStyles.buttonRow}>
              <TouchableOpacity style={modalStyles.cancelButton} onPress={onClose}>
                <Text style={modalStyles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={modalStyles.saveButton} onPress={() => { onSave(hour, minute); onClose(); }}>
                <Text style={modalStyles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const { settings, updateSettings, getActiveHabits, getDayByDate, selectedDate } = useData();
  const { activeActivities } = useActivities();

  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerField, setPickerField] = useState<'quietHoursStart' | 'quietHoursEnd'>('quietHoursStart');
  const [pickerHour, setPickerHour] = useState(23);
  const [pickerMinute, setPickerMinute] = useState(0);

  const timeSettings = settings.timeSettings || DEFAULT_TIME_SETTINGS;
  const activityCodes = useMemo(() => activeActivities.map(a => a.code), [activeActivities]);
  const notifFrequency = settings.notificationFrequency ?? 15;
  const customMinutes = settings.customNotificationMinutes ?? 45;

  const effectiveFrequencyMinutes = useMemo(() => {
    if (notifFrequency === 'custom') return customMinutes;
    return notifFrequency;
  }, [notifFrequency, customMinutes]);

  const openTimePicker = useCallback((field: 'quietHoursStart' | 'quietHoursEnd', currentValue: string) => {
    const [h, m] = currentValue.split(':').map(Number);
    setPickerField(field);
    setPickerHour(isNaN(h) ? 0 : h);
    setPickerMinute(isNaN(m) ? 0 : m);
    setPickerVisible(true);
  }, []);

  const handleTimePickerSave = useCallback((hour: number, minute: number) => {
    const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    updateSettings({ [pickerField]: timeStr });
    console.log(`[Notifications] DND ${pickerField} set to ${timeStr}`);
  }, [pickerField, updateSettings]);

  const rescheduleNotifications = useCallback(async () => {
    if (Platform.OS === 'web') return;

    await scheduleQuickLogNotifications(
      effectiveFrequencyMinutes,
      timeSettings.dayStartHour,
      timeSettings.dayStartMinute,
      timeSettings.dayEndHour,
      timeSettings.dayEndMinute,
      settings.quietHoursStart,
      settings.quietHoursEnd,
      settings.notificationsEnabled,
      activityCodes
    );

    const activeHabits = getActiveHabits();
    const dayData = getDayByDate(selectedDate);

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
    effectiveFrequencyMinutes,
    timeSettings,
    settings.quietHoursStart,
    settings.quietHoursEnd,
    settings.notificationsEnabled,
    settings.dailyReminderEnabled,
    activityCodes,
    getActiveHabits,
    getDayByDate,
    selectedDate,
  ]);

  const handleEnableNotifications = useCallback(async (val: boolean) => {
    updateSettings({ notificationsEnabled: val });
    if (val && Platform.OS !== 'web') {
      const granted = await requestPermissions();
      if (!granted) {
        console.log('[Notifications] Permission not granted, but setting saved');
      }
    }
  }, [updateSettings]);

  const handleEnableDailyReminder = useCallback(async (val: boolean) => {
    updateSettings({ dailyReminderEnabled: val });
    if (val && Platform.OS !== 'web') {
      const granted = await requestPermissions();
      if (!granted) {
        console.log('[Notifications] Permission not granted for daily reminder, but setting saved');
      }
    }
  }, [updateSettings]);

  const handleFrequencyChange = useCallback((freq: NotificationFrequency) => {
    updateSettings({ notificationFrequency: freq });
  }, [updateSettings]);

  const handleCustomMinutesChange = useCallback((val: string) => {
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 5 && num <= 120) {
      updateSettings({ customNotificationMinutes: num });
    }
  }, [updateSettings]);

  const handleStopWhenComplete = useCallback((val: boolean) => {
    updateSettings({ stopWhenComplete: val });
  }, [updateSettings]);

  useEffect(() => {
    rescheduleNotifications();
  }, [rescheduleNotifications]);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 16,
    },
    card: {
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 16,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.primaryText,
    },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    settingRowNoBorder: {
      borderBottomWidth: 0,
    },
    settingInfo: {
      flex: 1,
      marginRight: 12,
    },
    settingLabel: {
      fontSize: 14,
      color: colors.primaryText,
    },
    settingHint: {
      fontSize: 12,
      color: colors.secondaryText,
      marginTop: 4,
    },
    frequencyRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 8,
    },
    freqChip: {
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 10,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    freqChipActive: {
      backgroundColor: colors.highlight,
      borderColor: colors.highlight,
    },
    freqChipText: {
      fontSize: 13,
      fontWeight: '600' as const,
      color: colors.primaryText,
    },
    freqChipTextActive: {
      color: '#FFFFFF',
    },
    customInputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 10,
    },
    customInput: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.primaryText,
      paddingVertical: 8,
      paddingHorizontal: 14,
      backgroundColor: colors.background,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      width: 80,
      textAlign: 'center' as const,
    },
    customLabel: {
      fontSize: 14,
      color: colors.secondaryText,
    },
    sectionLabel: {
      fontSize: 13,
      fontWeight: '600' as const,
      color: colors.secondaryText,
      marginBottom: 6,
      marginTop: 8,
    },
    timeButton: {
      paddingVertical: 10,
      paddingHorizontal: 18,
      backgroundColor: colors.highlight + '18',
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: colors.highlight + '40',
      minWidth: 85,
      alignItems: 'center' as const,
    },
    timeButtonText: {
      fontSize: 17,
      fontWeight: '700' as const,
      color: colors.highlight,
      letterSpacing: 1,
    },
  }), [colors]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={[styles.card, SHADOWS.card]}>
          <View style={styles.cardHeader}>
            <Bell size={20} color={colors.highlight} />
            <Text style={styles.cardTitle}>Slot Reminders</Text>
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Enable Reminders</Text>
              <Text style={styles.settingHint}>
                Get notified to log your activity at regular intervals
              </Text>
            </View>
            <Switch
              value={settings.notificationsEnabled}
              onValueChange={handleEnableNotifications}
              trackColor={{ false: colors.divider, true: colors.highlight }}
            />
          </View>

          {settings.notificationsEnabled && (
            <>
              <Text style={styles.sectionLabel}>Frequency</Text>
              <View style={styles.frequencyRow}>
                {FREQUENCY_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={String(opt.value)}
                    style={[
                      styles.freqChip,
                      notifFrequency === opt.value && styles.freqChipActive,
                    ]}
                    onPress={() => handleFrequencyChange(opt.value)}
                  >
                    <Text
                      style={[
                        styles.freqChipText,
                        notifFrequency === opt.value && styles.freqChipTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {notifFrequency === 'custom' && (
                <View style={styles.customInputRow}>
                  <TextInput
                    style={styles.customInput}
                    value={String(customMinutes)}
                    onChangeText={handleCustomMinutesChange}
                    keyboardType="number-pad"
                    maxLength={3}
                  />
                  <Text style={styles.customLabel}>minutes</Text>
                </View>
              )}
            </>
          )}
        </View>

        <View style={[styles.card, SHADOWS.card]}>
          <View style={styles.cardHeader}>
            <BellOff size={20} color={colors.highlight} />
            <Text style={styles.cardTitle}>Do Not Disturb</Text>
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Start Time</Text>
            <TouchableOpacity
              style={styles.timeButton}
              onPress={() => openTimePicker('quietHoursStart', settings.quietHoursStart || '23:00')}
              activeOpacity={0.7}
            >
              <Text style={styles.timeButtonText}>{settings.quietHoursStart || '23:00'}</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.settingRow, styles.settingRowNoBorder]}>
            <Text style={styles.settingLabel}>End Time</Text>
            <TouchableOpacity
              style={styles.timeButton}
              onPress={() => openTimePicker('quietHoursEnd', settings.quietHoursEnd || '05:00')}
              activeOpacity={0.7}
            >
              <Text style={styles.timeButtonText}>{settings.quietHoursEnd || '05:00'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.card, SHADOWS.card]}>
          <View style={styles.cardHeader}>
            <CheckCircle size={20} color={colors.highlight} />
            <Text style={styles.cardTitle}>Smart Stop</Text>
          </View>

          <View style={[styles.settingRow, styles.settingRowNoBorder]}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Stop When Complete</Text>
              <Text style={styles.settingHint}>
                Stop sending notifications once all time slots for today are logged
              </Text>
            </View>
            <Switch
              value={settings.stopWhenComplete ?? false}
              onValueChange={handleStopWhenComplete}
              trackColor={{ false: colors.divider, true: colors.highlight }}
            />
          </View>
        </View>

        <View style={[styles.card, SHADOWS.card]}>
          <View style={styles.cardHeader}>
            <Clock size={20} color={colors.highlight} />
            <Text style={styles.cardTitle}>8 PM Daily Reminder</Text>
          </View>

          <View style={[styles.settingRow, styles.settingRowNoBorder]}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Enable 8 PM Reminder</Text>
              <Text style={styles.settingHint}>
                Get notified about remaining habits and to-dos at 8 PM daily
              </Text>
            </View>
            <Switch
              value={settings.dailyReminderEnabled ?? true}
              onValueChange={handleEnableDailyReminder}
              trackColor={{ false: colors.divider, true: colors.highlight }}
            />
          </View>
        </View>

        <View style={[styles.card, SHADOWS.card]}>
          <View style={styles.cardHeader}>
            <Zap size={20} color={colors.highlight} />
            <Text style={styles.cardTitle}>Strict Mode</Text>
          </View>

          <View style={[styles.settingRow, styles.settingRowNoBorder]}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Enable Strict Mode</Text>
              <Text style={styles.settingHint}>
                Send follow-up reminders if slot remains unlogged after 5 minutes
              </Text>
            </View>
            <Switch
              value={settings.strictMode}
              onValueChange={(val) => updateSettings({ strictMode: val })}
              trackColor={{ false: colors.divider, true: colors.error }}
            />
          </View>
        </View>
      </View>

      <TimePickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSave={handleTimePickerSave}
        initialHour={pickerHour}
        initialMinute={pickerMinute}
        title={pickerField === 'quietHoursStart' ? 'DND Start Time' : 'DND End Time'}
        colors={colors}
      />
    </ScrollView>
  );
}

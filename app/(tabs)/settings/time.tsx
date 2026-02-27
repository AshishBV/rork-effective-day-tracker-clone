import React, { useState, useMemo, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Clock, Check } from 'lucide-react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTheme } from '../../../contexts/ThemeContext';
import { useData } from '../../../contexts/DataContext';
import { useActivities } from '../../../contexts/ActivitiesContext';
import { SHADOWS } from '../../../constants/theme';
import Toast from '../../../components/Toast';
import { DEFAULT_TIME_SETTINGS } from '../../../types/data';
import { scheduleQuickLogNotifications } from '../../../utils/notifications';

const SLOT_DURATION_OPTIONS = [15, 30, 60];

export default function TimeSettingsScreen() {
  const { colors } = useTheme();
  const { settings, updateSettings } = useData();
  const { activeActivities } = useActivities();
  
  const timeSettings = settings.timeSettings || DEFAULT_TIME_SETTINGS;
  const activityCodes = useMemo(() => activeActivities.map(a => a.code), [activeActivities]);
  
  const [slotDuration, setSlotDuration] = useState(timeSettings.slotDuration);
  const [startTime, setStartTime] = useState(() => {
    const date = new Date();
    date.setHours(timeSettings.dayStartHour, timeSettings.dayStartMinute, 0, 0);
    return date;
  });
  const [endTime, setEndTime] = useState(() => {
    const date = new Date();
    date.setHours(timeSettings.dayEndHour, timeSettings.dayEndMinute, 0, 0);
    return date;
  });
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setToastVisible(true);
  }, []);

  const handleSave = useCallback(async () => {
    const newTimeSettings = {
      slotDuration,
      dayStartHour: startTime.getHours(),
      dayStartMinute: startTime.getMinutes(),
      dayEndHour: endTime.getHours(),
      dayEndMinute: endTime.getMinutes(),
    };
    
    const startMinutes = newTimeSettings.dayStartHour * 60 + newTimeSettings.dayStartMinute;
    const endMinutes = newTimeSettings.dayEndHour * 60 + newTimeSettings.dayEndMinute;
    
    if (endMinutes <= startMinutes) {
      showToast('End time must be after start time');
      return;
    }
    
    updateSettings({ timeSettings: newTimeSettings });
    
    if (Platform.OS !== 'web' && settings.notificationsEnabled) {
      await scheduleQuickLogNotifications(
        newTimeSettings.slotDuration,
        newTimeSettings.dayStartHour,
        newTimeSettings.dayStartMinute,
        newTimeSettings.dayEndHour,
        newTimeSettings.dayEndMinute,
        settings.quietHoursStart,
        settings.quietHoursEnd,
        settings.notificationsEnabled,
        activityCodes
      );
    }
    
    showToast('Time settings saved');
  }, [slotDuration, startTime, endTime, updateSettings, showToast, settings, activityCodes]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const totalSlots = useMemo(() => {
    const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
    const endMinutes = endTime.getHours() * 60 + endTime.getMinutes();
    const totalMinutes = endMinutes - startMinutes;
    return totalMinutes > 0 ? Math.floor(totalMinutes / slotDuration) : 0;
  }, [startTime, endTime, slotDuration]);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 16,
    },
    section: {
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.primaryText,
      marginBottom: 16,
    },
    optionsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    option: {
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 10,
      backgroundColor: colors.divider,
      minWidth: 60,
      alignItems: 'center',
    },
    optionSelected: {
      backgroundColor: colors.highlight,
    },
    optionText: {
      fontSize: 15,
      fontWeight: '600' as const,
      color: colors.primaryText,
    },
    optionTextSelected: {
      color: '#FFFFFF',
    },
    timeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    timeRowLast: {
      borderBottomWidth: 0,
    },
    timeLabel: {
      fontSize: 15,
      color: colors.primaryText,
    },
    timeValue: {
      fontSize: 15,
      fontWeight: '600' as const,
      color: colors.highlight,
    },
    summaryCard: {
      backgroundColor: colors.bannerBg,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    summaryText: {
      flex: 1,
      fontSize: 14,
      color: '#FFFFFF',
      fontWeight: '500' as const,
    },
    saveButton: {
      backgroundColor: colors.highlight,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: '#FFFFFF',
    },
    note: {
      fontSize: 13,
      color: colors.secondaryText,
      marginTop: 12,
      lineHeight: 20,
    },
  }), [colors]);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.summaryCard, SHADOWS.card]}>
          <Clock size={24} color="#FFFFFF" />
          <Text style={styles.summaryText}>
            {totalSlots} slots per day ({slotDuration} min each)
          </Text>
        </View>

        <View style={[styles.section, SHADOWS.card]}>
          <Text style={styles.sectionTitle}>Slot Duration</Text>
          <View style={styles.optionsRow}>
            {SLOT_DURATION_OPTIONS.map((duration) => (
              <TouchableOpacity
                key={duration}
                style={[styles.option, slotDuration === duration && styles.optionSelected]}
                onPress={() => setSlotDuration(duration)}
              >
                <Text style={[styles.optionText, slotDuration === duration && styles.optionTextSelected]}>
                  {duration} min
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.section, SHADOWS.card]}>
          <Text style={styles.sectionTitle}>Day Range</Text>
          
          <TouchableOpacity 
            style={styles.timeRow}
            onPress={() => setShowStartPicker(true)}
          >
            <Text style={styles.timeLabel}>Start Time</Text>
            <Text style={styles.timeValue}>{formatTime(startTime)}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.timeRow, styles.timeRowLast]}
            onPress={() => setShowEndPicker(true)}
          >
            <Text style={styles.timeLabel}>End Time</Text>
            <Text style={styles.timeValue}>{formatTime(endTime)}</Text>
          </TouchableOpacity>

          <Text style={styles.note}>
            Existing logs are preserved. The time grid will recalculate based on your new settings.
          </Text>
        </View>

        <TouchableOpacity style={[styles.saveButton, SHADOWS.card]} onPress={handleSave}>
          <Check size={20} color="#FFFFFF" />
          <Text style={styles.saveButtonText}>Save Settings</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {showStartPicker && (
        <DateTimePicker
          value={startTime}
          mode="time"
          is24Hour={false}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event: DateTimePickerEvent, date?: Date) => {
            setShowStartPicker(Platform.OS === 'ios');
            if (date) setStartTime(date);
          }}
        />
      )}

      {showEndPicker && (
        <DateTimePicker
          value={endTime}
          mode="time"
          is24Hour={false}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event: DateTimePickerEvent, date?: Date) => {
            setShowEndPicker(Platform.OS === 'ios');
            if (date) setEndTime(date);
          }}
        />
      )}

      <Toast
        visible={toastVisible}
        message={toastMessage}
        onHide={() => setToastVisible(false)}
      />
    </View>
  );
}

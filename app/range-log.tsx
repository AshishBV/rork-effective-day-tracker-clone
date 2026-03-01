import React, { useState, useMemo, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TimePickerModal from '../components/TimePickerModal';
import { Clock, Check, X } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useData } from '../contexts/DataContext';
import { useActivities } from '../contexts/ActivitiesContext';
import { SHADOWS } from '../constants/theme';
import Toast from '../components/Toast';
import { calculateTotalSlots } from '../utils/timeUtils';
import { DEFAULT_TIME_SETTINGS } from '../types/data';

export default function RangeLogScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { settings, updateMultipleSlots, selectedDate, getDayByDate } = useData();
  const { activeActivities } = useActivities();
  
  const timeSettings = settings.timeSettings || DEFAULT_TIME_SETTINGS;
  
  const [startTime, setStartTime] = useState(() => {
    const date = new Date();
    date.setHours(timeSettings.dayStartHour, timeSettings.dayStartMinute, 0, 0);
    return date;
  });
  const [endTime, setEndTime] = useState(() => {
    const date = new Date();
    const hour = Math.min(date.getHours() + 1, timeSettings.dayEndHour);
    date.setHours(hour, 0, 0, 0);
    return date;
  });
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setToastVisible(true);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const getSlotIndicesForRange = useCallback((start: Date, end: Date): number[] => {
    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const endMinutes = end.getHours() * 60 + end.getMinutes();
    const dayStartMinutes = timeSettings.dayStartHour * 60 + timeSettings.dayStartMinute;
    
    const indices: number[] = [];
    const totalSlots = calculateTotalSlots(timeSettings);
    
    for (let i = 0; i < totalSlots; i++) {
      const slotStartMinutes = dayStartMinutes + (i * timeSettings.slotDuration);
      const slotEndMinutes = slotStartMinutes + timeSettings.slotDuration;
      
      if (slotStartMinutes >= startMinutes && slotEndMinutes <= endMinutes) {
        indices.push(i);
      }
    }
    
    return indices;
  }, [timeSettings]);

  const affectedSlots = useMemo(() => {
    return getSlotIndicesForRange(startTime, endTime);
  }, [startTime, endTime, getSlotIndicesForRange]);

  const handleSave = useCallback(() => {
    if (!selectedActivity) {
      Alert.alert('Select Activity', 'Please select an activity category');
      return;
    }

    const startMinutes = startTime.getHours() * 60 + startTime.getMinutes();
    const endMinutes = endTime.getHours() * 60 + endTime.getMinutes();

    if (endMinutes <= startMinutes) {
      Alert.alert('Invalid Range', 'End time must be after start time');
      return;
    }

    if (affectedSlots.length === 0) {
      Alert.alert('No Slots', 'No time slots fall within the selected range');
      return;
    }

    const dayData = getDayByDate(selectedDate);
    const existingFilledSlots = affectedSlots.filter(i => dayData.slots[i]?.activityCategory !== null);

    const performUpdate = () => {
      updateMultipleSlots(affectedSlots, {
        activityCategory: selectedActivity,
        performedActivityText: description,
      }, selectedDate);
      
      showToast(`Logged ${affectedSlots.length} slots`);
      setTimeout(() => router.back(), 500);
    };

    if (existingFilledSlots.length > 0) {
      Alert.alert(
        'Overwrite Existing?',
        `${existingFilledSlots.length} slot(s) already have data. Do you want to overwrite them?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Overwrite All', onPress: performUpdate },
          {
            text: 'Fill Empty Only',
            onPress: () => {
              const emptySlots = affectedSlots.filter(i => dayData.slots[i]?.activityCategory === null);
              if (emptySlots.length > 0) {
                updateMultipleSlots(emptySlots, {
                  activityCategory: selectedActivity,
                  performedActivityText: description,
                }, selectedDate);
                showToast(`Logged ${emptySlots.length} empty slots`);
              } else {
                showToast('No empty slots to fill');
              }
              setTimeout(() => router.back(), 500);
            },
          },
        ]
      );
    } else {
      performUpdate();
    }
  }, [selectedActivity, startTime, endTime, affectedSlots, description, selectedDate, getDayByDate, updateMultipleSlots, showToast, router]);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
      backgroundColor: colors.cardBackground,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700' as const,
      color: colors.primaryText,
    },
    closeButton: {
      padding: 8,
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
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.secondaryText,
      marginBottom: 16,
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
    activityGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    activityButton: {
      paddingVertical: 14,
      paddingHorizontal: 18,
      borderRadius: 12,
      minWidth: 60,
      alignItems: 'center',
    },
    activityButtonSelected: {
      borderWidth: 3,
      borderColor: colors.primaryText,
    },
    activityCode: {
      fontSize: 16,
      fontWeight: '700' as const,
    },
    activityName: {
      fontSize: 10,
      marginTop: 2,
    },
    textInput: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      borderRadius: 12,
      padding: 14,
      fontSize: 15,
      color: colors.primaryText,
      minHeight: 100,
      textAlignVertical: 'top',
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
    saveButtonDisabled: {
      opacity: 0.5,
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: '#FFFFFF',
    },
  }), [colors]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <X size={24} color={colors.primaryText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Log Time Range</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.summaryCard, SHADOWS.card]}>
          <Clock size={24} color="#FFFFFF" />
          <Text style={styles.summaryText}>
            {affectedSlots.length} slots will be logged for {selectedDate}
          </Text>
        </View>

        <View style={[styles.section, SHADOWS.card]}>
          <Text style={styles.sectionTitle}>Time Range</Text>
          
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
        </View>

        <View style={[styles.section, SHADOWS.card]}>
          <Text style={styles.sectionTitle}>Activity Category</Text>
          <View style={styles.activityGrid}>
            {activeActivities.map((activity) => (
              <TouchableOpacity
                key={activity.id}
                style={[
                  styles.activityButton,
                  { backgroundColor: activity.color },
                  selectedActivity === activity.code && styles.activityButtonSelected,
                ]}
                onPress={() => setSelectedActivity(activity.code)}
              >
                <Text style={[styles.activityCode, { color: activity.textColor }]}>
                  {activity.code}
                </Text>
                <Text style={[styles.activityName, { color: activity.textColor }]} numberOfLines={1}>
                  {activity.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.section, SHADOWS.card]}>
          <Text style={styles.sectionTitle}>Description (Optional)</Text>
          <TextInput
            style={styles.textInput}
            value={description}
            onChangeText={setDescription}
            placeholder="What did you do during this time?"
            placeholderTextColor={colors.secondaryText}
            multiline
          />
        </View>

        <TouchableOpacity 
          style={[
            styles.saveButton, 
            SHADOWS.card,
            (!selectedActivity || affectedSlots.length === 0) && styles.saveButtonDisabled
          ]} 
          onPress={handleSave}
          disabled={!selectedActivity || affectedSlots.length === 0}
        >
          <Check size={20} color="#FFFFFF" />
          <Text style={styles.saveButtonText}>Log {affectedSlots.length} Slots</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      <TimePickerModal
        visible={showStartPicker}
        value={startTime}
        onConfirm={(date) => {
          setStartTime(date);
          setShowStartPicker(false);
        }}
        onCancel={() => setShowStartPicker(false)}
        accentColor={colors.highlight}
        backgroundColor={colors.cardBackground}
        textColor={colors.primaryText}
        secondaryTextColor={colors.secondaryText}
      />

      <TimePickerModal
        visible={showEndPicker}
        value={endTime}
        onConfirm={(date) => {
          setEndTime(date);
          setShowEndPicker(false);
        }}
        onCancel={() => setShowEndPicker(false)}
        accentColor={colors.highlight}
        backgroundColor={colors.cardBackground}
        textColor={colors.primaryText}
        secondaryTextColor={colors.secondaryText}
      />

      <Toast
        visible={toastVisible}
        message={toastMessage}
        onHide={() => setToastVisible(false)}
      />
    </View>
  );
}

import React, { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';
import { useActivities } from '../contexts/ActivitiesContext';
import { TimeSlot } from '../types/data';

interface TimeSlotRowProps {
  slot: TimeSlot;
  isCurrentSlot: boolean;
  isPreviousSlot: boolean;
  isSelected: boolean;
  showInlineButtons?: boolean;
  onPress: () => void;
  onLongPress: () => void;
  onQuickLog?: (slotIndex: number, category: string) => void;
}

export default function TimeSlotRow({ 
  slot, 
  isCurrentSlot, 
  isPreviousSlot,
  isSelected,
  showInlineButtons = false,
  onPress, 
  onLongPress,
  onQuickLog,
}: TimeSlotRowProps) {
  const { colors, isDark } = useTheme();
  const { getActivityByCode, activeActivities } = useActivities();
  const category = slot.activityCategory ? getActivityByCode(slot.activityCategory) : null;
  const plannedActivity = slot.plannedCategory ? getActivityByCode(slot.plannedCategory) : null;
  const isUnlogged = !slot.activityCategory;

  const handleInlineLog = useCallback((code: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onQuickLog?.(slot.index, code);
  }, [onQuickLog, slot.index]);

  const styles = useMemo(() => StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
      backgroundColor: colors.cardBackground,
    },
    currentSlot: {
      backgroundColor: isDark ? '#1B4332' : '#E8F5E9',
      borderLeftWidth: 4,
      borderLeftColor: colors.success,
    },
    previousSlot: {
      backgroundColor: isDark ? '#3D2E1F' : '#FFF8E1',
      borderLeftWidth: 4,
      borderLeftColor: colors.accentYellow,
    },
    selectedSlot: {
      backgroundColor: isDark ? '#1A3A4A' : '#E3F2FD',
      borderLeftWidth: 4,
      borderLeftColor: colors.highlight,
    },
    timeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      width: 110,
    },
    timeText: {
      fontSize: 13,
      fontWeight: '600' as const,
      color: colors.primaryText,
      fontVariant: ['tabular-nums'],
    },
    timeSeparator: {
      fontSize: 12,
      color: colors.secondaryText,
      marginHorizontal: 4,
    },
    categoryContainer: {
      width: 44,
      alignItems: 'center',
    },
    categoryPill: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 6,
    },
    categoryText: {
      fontSize: 12,
      fontWeight: '700' as const,
    },
    unloggedPill: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 6,
      backgroundColor: colors.divider,
    },
    unloggedText: {
      fontSize: 12,
      fontWeight: '600' as const,
      color: colors.secondaryText,
    },
    activityContainer: {
      flex: 1,
      marginLeft: 12,
    },
    activityText: {
      fontSize: 13,
      color: colors.primaryText,
    },
    tapToLog: {
      fontSize: 13,
      color: colors.secondaryText,
      fontStyle: 'italic',
    },
    plannedIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginLeft: 8,
    },
    inlineButtons: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      marginLeft: 6,
      flex: 1,
    },
    inlineBtn: {
      paddingHorizontal: 5,
      paddingVertical: 3,
      borderRadius: 5,
      alignItems: 'center',
      justifyContent: 'center',
    },
    inlineBtnText: {
      fontSize: 9,
      fontWeight: '700' as const,
      letterSpacing: 0.2,
    },
  }), [colors, isDark]);

  return (
    <TouchableOpacity
      style={[
        styles.row,
        isCurrentSlot && styles.currentSlot,
        isPreviousSlot && styles.previousSlot,
        isSelected && styles.selectedSlot,
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      <View style={styles.timeContainer}>
        <Text style={styles.timeText}>{slot.timeIn}</Text>
        <Text style={styles.timeSeparator}>→</Text>
        <Text style={styles.timeText}>{slot.timeOut}</Text>
      </View>

      <View style={styles.categoryContainer}>
        {category ? (
          <View style={[styles.categoryPill, { backgroundColor: category.color }]}>
            <Text style={[styles.categoryText, { color: category.textColor }]}>
              {category.code}
            </Text>
          </View>
        ) : (
          <View style={styles.unloggedPill}>
            <Text style={styles.unloggedText}>-</Text>
          </View>
        )}
      </View>

      {isUnlogged && showInlineButtons && onQuickLog ? (
        <View style={styles.inlineButtons}>
          {activeActivities.slice(0, 7).map((act) => (
            <TouchableOpacity
              key={act.id}
              style={[styles.inlineBtn, { backgroundColor: act.color }]}
              onPress={() => handleInlineLog(act.code)}
              activeOpacity={0.7}
              hitSlop={{ top: 4, bottom: 4, left: 2, right: 2 }}
            >
              <Text style={[styles.inlineBtnText, { color: act.textColor }]}>
                {act.code}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.activityContainer}>
          {slot.performedActivityText ? (
            <Text style={styles.activityText} numberOfLines={1}>
              {slot.performedActivityText}
            </Text>
          ) : (
            <Text style={styles.tapToLog}>
              {category ? '' : ''}
            </Text>
          )}
        </View>
      )}

      {plannedActivity && (
        <View style={[
          styles.plannedIndicator,
          { backgroundColor: plannedActivity.color }
        ]} />
      )}
    </TouchableOpacity>
  );
}

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TrendingUp, CheckCircle } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { SHADOWS } from '../constants/theme';
import { DayData, Habit, DEFAULT_HABITS } from '../types/data';
import { calculateDayER } from '../utils/timeUtils';
import { useActivities } from '../contexts/ActivitiesContext';

interface DaySummaryCardProps {
  selectedDate: string;
  days: Record<string, DayData>;
  activeHabits?: Habit[];
}

export default function DaySummaryCard({ selectedDate, days, activeHabits }: DaySummaryCardProps) {
  const { colors } = useTheme();
  const { activities } = useActivities();
  const habits = activeHabits || DEFAULT_HABITS;

  const selectedDaySummary = useMemo(() => {
    const dayData = days[selectedDate];
    const activeHabitsList = habits.filter(h => h.active);
    const habitsTotal = activeHabitsList.length;
    let erValue: number | null = null;
    let habitsCompleted = 0;

    if (dayData) {
      const filledCount = dayData.slots.filter(s => s.activityCategory !== null).length;
      if (filledCount > 0) {
        erValue = calculateDayER(dayData.slots, activities);
      }
      habitsCompleted = activeHabitsList.filter(h => dayData.habitCompletions?.[h.id]).length;
    }

    return { erValue, habitsCompleted, habitsTotal };
  }, [selectedDate, days, habits, activities]);

  const styles = useMemo(() => StyleSheet.create({
    daySummaryCard: {
      marginHorizontal: 16,
      marginTop: 12,
      backgroundColor: colors.cardBackground,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
    },
    summaryItem: {
      alignItems: 'center',
      flex: 1,
    },
    summaryDivider: {
      width: 1,
      height: 40,
      backgroundColor: colors.divider,
    },
    summaryLabel: {
      fontSize: 12,
      fontWeight: '500' as const,
      color: colors.secondaryText,
      marginBottom: 6,
    },
    summaryValueContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    summaryValue: {
      fontSize: 24,
      fontWeight: '700' as const,
      color: colors.primaryText,
    },
    summaryValueSmall: {
      fontSize: 18,
      fontWeight: '600' as const,
      color: colors.primaryText,
    },
    summaryValueHighlight: {
      color: colors.highlight,
    },
    summaryValueSuccess: {
      color: colors.success,
    },
    summaryValueNeutral: {
      color: colors.secondaryText,
    },
  }), [colors]);

  return (
    <View style={[styles.daySummaryCard, SHADOWS.card]}>
      <View style={styles.summaryItem}>
        <Text style={styles.summaryLabel}>Effective Ratio</Text>
        <View style={styles.summaryValueContainer}>
          <TrendingUp size={18} color={selectedDaySummary.erValue !== null ? colors.highlight : colors.secondaryText} />
          <Text style={[
            styles.summaryValue,
            selectedDaySummary.erValue !== null ? styles.summaryValueHighlight : styles.summaryValueNeutral
          ]}>
            {selectedDaySummary.erValue !== null ? selectedDaySummary.erValue.toFixed(2) : '--'}
          </Text>
        </View>
      </View>
      <View style={styles.summaryDivider} />
      <View style={styles.summaryItem}>
        <Text style={styles.summaryLabel}>Habits Completed</Text>
        <View style={styles.summaryValueContainer}>
          <CheckCircle size={18} color={selectedDaySummary.habitsCompleted === selectedDaySummary.habitsTotal && selectedDaySummary.habitsTotal > 0 ? colors.success : colors.secondaryText} />
          <Text style={[
            styles.summaryValueSmall,
            selectedDaySummary.habitsCompleted === selectedDaySummary.habitsTotal && selectedDaySummary.habitsTotal > 0 
              ? styles.summaryValueSuccess 
              : styles.summaryValueNeutral
          ]}>
            {selectedDaySummary.habitsCompleted} / {selectedDaySummary.habitsTotal}
          </Text>
        </View>
      </View>
    </View>
  );
}

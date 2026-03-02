import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useData } from '../contexts/DataContext';
import { useActivities } from '../contexts/ActivitiesContext';
import { SHADOWS } from '../constants/theme';
import { calculateDayER } from '../utils/timeUtils';
import { DayData } from '../types/data';

interface StreaksCardProps {
  selectedDate: string;
}

export default function StreaksCard({ selectedDate }: StreaksCardProps) {
  const { colors } = useTheme();
  const { days, settings, getActiveHabits } = useData();
  const { activities } = useActivities();
  const activeHabits = useMemo(() => getActiveHabits(), [getActiveHabits]);

  const streaks = useMemo(() => {
    const erGoal = (settings.erGoal || 80) / 100;
    const today = new Date(selectedDate + 'T12:00:00');

    let erStreak = 0;
    let habitsStreak = 0;

    const d = new Date(today);
    d.setDate(d.getDate() - 1);

    while (true) {
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const dayData: DayData | undefined = days[key];
      if (!dayData) break;

      const filledSlots = dayData.slots.filter(s => s.activityCategory !== null);
      if (filledSlots.length === 0) break;

      const er = calculateDayER(dayData.slots, activities);
      if (er >= erGoal) {
        erStreak++;
      } else {
        break;
      }
      d.setDate(d.getDate() - 1);
    }

    const todayData = days[selectedDate];
    if (todayData) {
      const filledSlots = todayData.slots.filter(s => s.activityCategory !== null);
      if (filledSlots.length > 0) {
        const er = calculateDayER(todayData.slots, activities);
        if (er >= erGoal) {
          erStreak++;
        }
      }
    }

    const d2 = new Date(today);
    d2.setDate(d2.getDate() - 1);

    while (true) {
      const key = `${d2.getFullYear()}-${String(d2.getMonth() + 1).padStart(2, '0')}-${String(d2.getDate()).padStart(2, '0')}`;
      const dayData: DayData | undefined = days[key];
      if (!dayData) break;

      if (activeHabits.length === 0) break;

      const allCompleted = activeHabits.every(h => dayData.habitCompletions?.[h.id]);
      if (allCompleted) {
        habitsStreak++;
      } else {
        break;
      }
      d2.setDate(d2.getDate() - 1);
    }

    if (todayData && activeHabits.length > 0) {
      const allCompleted = activeHabits.every(h => todayData.habitCompletions?.[h.id]);
      if (allCompleted) {
        habitsStreak++;
      }
    }

    return { erStreak, habitsStreak };
  }, [days, selectedDate, settings.erGoal, activities, activeHabits]);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flexDirection: 'row',
      marginHorizontal: 16,
      marginTop: 10,
      gap: 10,
    },
    streakBox: {
      flex: 1,
      backgroundColor: colors.cardBackground,
      borderRadius: 14,
      paddingVertical: 14,
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    streakNumber: {
      fontSize: 28,
      fontWeight: '800' as const,
      color: colors.primaryText,
      fontVariant: ['tabular-nums'],
    },
    streakMeta: {
      flex: 1,
    },
    streakLabel: {
      fontSize: 12,
      fontWeight: '600' as const,
      color: colors.secondaryText,
      letterSpacing: 0.3,
    },
    streakGoal: {
      fontSize: 10,
      color: colors.secondaryText,
      marginTop: 2,
      opacity: 0.7,
    },
    fireEmoji: {
      fontSize: 20,
    },
  }), [colors]);

  return (
    <View style={styles.container}>
      <View style={[styles.streakBox, SHADOWS.card]}>
        <Text style={styles.fireEmoji}>{streaks.erStreak > 0 ? '🔥' : '💤'}</Text>
        <Text style={styles.streakNumber}>{streaks.erStreak}</Text>
        <View style={styles.streakMeta}>
          <Text style={styles.streakLabel}>ER Streak</Text>
          <Text style={styles.streakGoal}>≥{settings.erGoal || 80}% goal</Text>
        </View>
      </View>
      <View style={[styles.streakBox, SHADOWS.card]}>
        <Text style={styles.fireEmoji}>{streaks.habitsStreak > 0 ? '🔥' : '💤'}</Text>
        <Text style={styles.streakNumber}>{streaks.habitsStreak}</Text>
        <View style={styles.streakMeta}>
          <Text style={styles.streakLabel}>Habits Streak</Text>
          <Text style={styles.streakGoal}>All completed</Text>
        </View>
      </View>
    </View>
  );
}

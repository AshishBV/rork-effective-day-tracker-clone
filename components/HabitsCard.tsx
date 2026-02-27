import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';
import { SHADOWS } from '../constants/theme';
import { useData } from '../contexts/DataContext';
import { Habit } from '../types/data';

interface HabitsCardProps {
  dateKey: string;
}

export default function HabitsCard({ dateKey }: HabitsCardProps) {
  const { colors } = useTheme();
  const { getActiveHabits, getHabitCompletion, setHabitCompletion } = useData();
  
  const activeHabits = useMemo(() => getActiveHabits(), [getActiveHabits]);
  
  const habitStates = useMemo(() => {
    return activeHabits.map(h => ({
      habit: h,
      completed: getHabitCompletion(dateKey, h.id),
    }));
  }, [activeHabits, dateKey, getHabitCompletion]);

  const completedCount = habitStates.filter(h => h.completed).length;
  const totalCount = activeHabits.length;

  const toggleHabit = useCallback((habitId: string, currentState: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setHabitCompletion(dateKey, habitId, !currentState);
  }, [dateKey, setHabitCompletion]);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      backgroundColor: colors.cardBackground,
      marginHorizontal: 16,
      marginTop: 12,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    title: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.primaryText,
    },
    progressBadge: {
      backgroundColor: colors.highlight,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    progressText: {
      fontSize: 12,
      fontWeight: '600' as const,
      color: '#FFFFFF',
    },
    habitsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    habitItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 10,
      gap: 6,
      minWidth: '45%',
      flex: 1,
      maxWidth: '100%',
    },
    habitItemCompleted: {
      backgroundColor: `${colors.success}15`,
      borderWidth: 1,
      borderColor: `${colors.success}30`,
    },
    checkbox: {
      width: 18,
      height: 18,
      borderRadius: 5,
      borderWidth: 2,
      borderColor: colors.cardBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxCompleted: {
      backgroundColor: colors.success,
      borderColor: colors.success,
    },
    habitEmoji: {
      fontSize: 14,
    },
    habitName: {
      fontSize: 11,
      color: colors.primaryText,
      flex: 1,
    },
    habitNameCompleted: {
      color: colors.success,
    },
  }), [colors]);

  if (activeHabits.length === 0) {
    return null;
  }

  return (
    <View style={[styles.container, SHADOWS.card]}>
      <View style={styles.header}>
        <Text style={styles.title}>Daily Habits</Text>
        <View style={styles.progressBadge}>
          <Text style={styles.progressText}>{completedCount}/{totalCount}</Text>
        </View>
      </View>
      
      <View style={styles.habitsGrid}>
        {habitStates.map(({ habit, completed }) => (
          <TouchableOpacity
            key={habit.id}
            style={[styles.habitItem, completed && styles.habitItemCompleted]}
            onPress={() => toggleHabit(habit.id, completed)}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, completed && styles.checkboxCompleted]}>
              {completed && <Check size={12} color="#FFFFFF" />}
            </View>
            <Text style={styles.habitEmoji}>{habit.emoji}</Text>
            <Text style={[styles.habitName, completed && styles.habitNameCompleted]} numberOfLines={2}>
              {habit.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

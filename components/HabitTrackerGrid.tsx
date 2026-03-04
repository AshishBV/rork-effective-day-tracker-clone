import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

interface HabitDay {
  day: number;
  completed: boolean;
  isFuture: boolean;
}

interface HabitRow {
  id: string;
  name: string;
  emoji: string;
  days: HabitDay[];
  completionRate: number;
}

interface HabitTrackerGridProps {
  habits: HabitRow[];
  daysInMonth: number;
  accentColor?: string;
  isLandscape?: boolean;
}

export default function HabitTrackerGrid({
  habits,
  daysInMonth,
  accentColor = '#127475',
  isLandscape = false,
}: HabitTrackerGridProps) {
  const circleSize = isLandscape ? 20 : 14;
  const circleGap = isLandscape ? 6 : 4;
  const nameWidth = isLandscape ? 140 : 90;
  const pctWidth = isLandscape ? 54 : 40;
  const fontSize = isLandscape ? 13 : 10;
  const headerFontSize = isLandscape ? 11 : 8;
  const rowHeight = circleSize + (isLandscape ? 14 : 10);

  const dayNumbers = useMemo(() => {
    const nums: number[] = [];
    for (let i = 1; i <= daysInMonth; i++) nums.push(i);
    return nums;
  }, [daysInMonth]);

  const gridWidth = dayNumbers.length * (circleSize + circleGap);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      backgroundColor: '#1A2332',
      borderRadius: 12,
      padding: isLandscape ? 20 : 12,
      overflow: 'hidden',
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      marginBottom: isLandscape ? 10 : 6,
    },
    nameCol: {
      width: nameWidth,
      paddingRight: 6,
    },
    pctCol: {
      width: pctWidth,
      alignItems: 'flex-end' as const,
      paddingLeft: 6,
    },
    dayHeadersWrap: {
      flexDirection: 'row',
    },
    dayHeader: {
      width: circleSize,
      marginRight: circleGap,
      alignItems: 'center' as const,
    },
    dayHeaderText: {
      fontSize: headerFontSize,
      color: 'rgba(255,255,255,0.35)',
      fontWeight: '500' as const,
      textAlign: 'center' as const,
    },
    habitRow: {
      flexDirection: 'row',
      alignItems: 'center',
      height: rowHeight,
    },
    habitName: {
      fontSize: fontSize,
      color: 'rgba(255,255,255,0.85)',
      fontStyle: 'italic' as const,
      fontWeight: '300' as const,
    },
    habitEmoji: {
      fontSize: isLandscape ? 14 : 11,
      marginRight: 4,
    },
    habitNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      width: nameWidth,
      paddingRight: 6,
    },
    circlesRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    circle: {
      width: circleSize,
      height: circleSize,
      borderRadius: circleSize / 2,
      marginRight: circleGap,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
    },
    circleFilled: {
      backgroundColor: accentColor,
    },
    circleEmpty: {
      backgroundColor: 'transparent',
      borderWidth: 1.2,
      borderColor: 'rgba(255,255,255,0.18)',
    },
    circleGhost: {
      backgroundColor: 'rgba(255,255,255,0.05)',
    },
    pctText: {
      fontSize: isLandscape ? 13 : 10,
      fontWeight: '600' as const,
      color: 'rgba(255,255,255,0.7)',
      textAlign: 'right' as const,
      width: pctWidth,
    },
    checkMark: {
      fontSize: isLandscape ? 11 : 8,
      color: '#FFFFFF',
      fontWeight: '700' as const,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: 'rgba(255,255,255,0.06)',
      marginLeft: nameWidth,
      marginRight: pctWidth,
    },
    emptyState: {
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingVertical: 40,
    },
    emptyText: {
      fontSize: 14,
      color: 'rgba(255,255,255,0.4)',
      fontStyle: 'italic' as const,
    },
  }), [circleSize, circleGap, nameWidth, pctWidth, fontSize, headerFontSize, rowHeight, accentColor, isLandscape]);

  if (habits.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No active habits</Text>
        </View>
      </View>
    );
  }

  const gridContent = (
    <View>
      <View style={styles.headerRow}>
        <View style={styles.nameCol} />
        <View style={styles.dayHeadersWrap}>
          {dayNumbers.map(d => (
            <View key={d} style={styles.dayHeader}>
              <Text style={styles.dayHeaderText}>{d}</Text>
            </View>
          ))}
        </View>
        <View style={styles.pctCol} />
      </View>

      {habits.map((habit, idx) => (
        <View key={habit.id}>
          {idx > 0 && <View style={styles.divider} />}
          <View style={styles.habitRow}>
            <View style={styles.habitNameRow}>
              <Text style={styles.habitEmoji}>{habit.emoji}</Text>
              <Text style={styles.habitName} numberOfLines={1} ellipsizeMode="tail">
                {habit.name}
              </Text>
            </View>
            <View style={styles.circlesRow}>
              {habit.days.map(dayInfo => {
                const circleStyle = dayInfo.isFuture
                  ? styles.circleGhost
                  : dayInfo.completed
                    ? styles.circleFilled
                    : styles.circleEmpty;

                return (
                  <View key={dayInfo.day} style={[styles.circle, circleStyle]}>
                    {dayInfo.completed && !dayInfo.isFuture && (
                      <Text style={styles.checkMark}>✓</Text>
                    )}
                  </View>
                );
              })}
            </View>
            <Text style={styles.pctText}>
              {Math.round(habit.completionRate)}%
            </Text>
          </View>
        </View>
      ))}
    </View>
  );

  if (isLandscape) {
    return (
      <View style={styles.container}>
        {gridContent}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ minWidth: nameWidth + gridWidth + pctWidth + 12 }}>
          {gridContent}
        </View>
      </ScrollView>
    </View>
  );
}

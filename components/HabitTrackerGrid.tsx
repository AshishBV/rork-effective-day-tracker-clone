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

const COLORS = {
  cardBg: '#0D1117',
  filledCircle: '#FF4D6D',
  filledGlow: 'rgba(255, 77, 109, 0.3)',
  emptyCircle: '#1E2530',
  emptyBorder: 'rgba(139, 148, 158, 0.25)',
  ghostCircle: 'rgba(30, 37, 48, 0.5)',
  textColor: '#8B949E',
  dividerColor: 'rgba(139, 148, 158, 0.08)',
  streakColor: '#FF4D6D',
};

export default function HabitTrackerGrid({
  habits,
  daysInMonth,
  isLandscape = false,
}: HabitTrackerGridProps) {
  const circleSize = isLandscape ? 16 : 14;
  const circleGap = isLandscape ? 4 : 4;
  const nameWidth = isLandscape ? 120 : 90;
  const pctWidth = isLandscape ? 54 : 40;
  const fontSize = isLandscape ? 12 : 10;
  const headerFontSize = isLandscape ? 10 : 8;
  const rowHeight = circleSize + (isLandscape ? 14 : 10);

  const dayNumbers = useMemo(() => {
    const nums: number[] = [];
    for (let i = 1; i <= daysInMonth; i++) nums.push(i);
    return nums;
  }, [daysInMonth]);

  const gridWidth = dayNumbers.length * (circleSize + circleGap);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      backgroundColor: COLORS.cardBg,
      borderRadius: 12,
      padding: isLandscape ? 16 : 12,
      overflow: 'hidden',
    },
    outerRow: {
      flexDirection: 'row',
    },
    stickyNameCol: {
      width: nameWidth,
      zIndex: 2,
    },
    stickyPctCol: {
      width: pctWidth,
      zIndex: 2,
    },
    scrollableArea: {
      flex: 1,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      marginBottom: isLandscape ? 8 : 6,
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
      color: COLORS.textColor,
      fontWeight: '500' as const,
      textAlign: 'center' as const,
      opacity: 0.6,
    },
    habitRow: {
      flexDirection: 'row',
      alignItems: 'center',
      height: rowHeight,
    },
    habitName: {
      fontSize: fontSize,
      color: COLORS.textColor,
      fontStyle: 'italic' as const,
      fontWeight: '300' as const,
    },
    habitEmoji: {
      fontSize: isLandscape ? 13 : 11,
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
      backgroundColor: COLORS.filledCircle,
      shadowColor: COLORS.filledCircle,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 4,
      elevation: 3,
    },
    circleEmpty: {
      backgroundColor: COLORS.emptyCircle,
      borderWidth: 1,
      borderColor: COLORS.emptyBorder,
    },
    circleGhost: {
      backgroundColor: COLORS.ghostCircle,
      opacity: 0.4,
    },
    pctText: {
      fontSize: isLandscape ? 12 : 10,
      fontWeight: '600' as const,
      color: COLORS.streakColor,
      textAlign: 'right' as const,
      width: pctWidth,
    },
    checkMark: {
      fontSize: isLandscape ? 9 : 7,
      color: '#FFFFFF',
      fontWeight: '700' as const,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: COLORS.dividerColor,
    },
    emptyState: {
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      paddingVertical: 40,
    },
    emptyText: {
      fontSize: 14,
      color: COLORS.textColor,
      fontStyle: 'italic' as const,
    },
    legendRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      marginTop: isLandscape ? 10 : 8,
      paddingTop: 8,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: COLORS.dividerColor,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    legendDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    legendText: {
      fontSize: 9,
      color: COLORS.textColor,
      opacity: 0.7,
    },
  }), [circleSize, circleGap, nameWidth, pctWidth, fontSize, headerFontSize, rowHeight, isLandscape]);

  if (habits.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No active habits</Text>
        </View>
      </View>
    );
  }

  const renderNameColumn = () => (
    <View style={styles.stickyNameCol}>
      <View style={[styles.nameCol, { height: headerFontSize + (isLandscape ? 10 : 6), justifyContent: 'flex-end' as const }]}>
        <Text style={[styles.dayHeaderText, { opacity: 0 }]}> </Text>
      </View>
      {habits.map((habit, idx) => (
        <View key={habit.id}>
          {idx > 0 && <View style={styles.divider} />}
          <View style={[styles.habitNameRow, { height: rowHeight }]}>
            <Text style={styles.habitEmoji}>{habit.emoji}</Text>
            <Text style={styles.habitName} numberOfLines={1} ellipsizeMode="tail">
              {habit.name}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );

  const renderPctColumn = () => (
    <View style={styles.stickyPctCol}>
      <View style={[styles.pctCol, { height: headerFontSize + (isLandscape ? 10 : 6), justifyContent: 'flex-end' as const }]}>
        <Text style={[styles.dayHeaderText, { opacity: 0 }]}> </Text>
      </View>
      {habits.map((habit, idx) => (
        <View key={habit.id}>
          {idx > 0 && <View style={styles.divider} />}
          <View style={{ height: rowHeight, justifyContent: 'center' as const }}>
            <Text style={styles.pctText}>
              {Math.round(habit.completionRate)}%
            </Text>
          </View>
        </View>
      ))}
    </View>
  );

  const renderCirclesGrid = () => (
    <View>
      <View style={[styles.dayHeadersWrap, { marginBottom: isLandscape ? 8 : 6 }]}>
        {dayNumbers.map(d => (
          <View key={d} style={styles.dayHeader}>
            <Text style={styles.dayHeaderText}>{d}</Text>
          </View>
        ))}
      </View>
      {habits.map((habit, idx) => (
        <View key={habit.id}>
          {idx > 0 && <View style={styles.divider} />}
          <View style={[styles.circlesRow, { height: rowHeight }]}>
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
        </View>
      ))}
    </View>
  );

  const legend = (
    <View style={styles.legendRow}>
      <View style={styles.legendItem}>
        <View style={[styles.legendDot, { backgroundColor: COLORS.filledCircle }]} />
        <Text style={styles.legendText}>Completed</Text>
      </View>
      <View style={styles.legendItem}>
        <View style={[styles.legendDot, { backgroundColor: COLORS.emptyCircle, borderWidth: 1, borderColor: COLORS.emptyBorder }]} />
        <Text style={styles.legendText}>Missed</Text>
      </View>
      <View style={styles.legendItem}>
        <View style={[styles.legendDot, { backgroundColor: COLORS.ghostCircle, opacity: 0.4 }]} />
        <Text style={styles.legendText}>Upcoming</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.outerRow}>
        {renderNameColumn()}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.scrollableArea}
          contentContainerStyle={{ minWidth: gridWidth }}
        >
          {renderCirclesGrid()}
        </ScrollView>
        {renderPctColumn()}
      </View>
      {legend}
    </View>
  );
}

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface DaySpentBarProps {
  percentage: number;
}

export default function DaySpentBar({ percentage }: DaySpentBarProps) {
  const { colors } = useTheme();
  const progress = Math.min(Math.max(percentage, 0), 1);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.cardBackground,
      borderRadius: 20,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    label: {
      fontSize: 12,
      fontWeight: '500' as const,
      color: colors.secondaryText,
      marginRight: 8,
    },
    barContainer: {
      flex: 1,
      height: 6,
      backgroundColor: colors.divider,
      borderRadius: 3,
      overflow: 'hidden',
    },
    barFill: {
      height: '100%',
      backgroundColor: colors.highlight,
      borderRadius: 3,
    },
    percentage: {
      fontSize: 12,
      fontWeight: '600' as const,
      color: colors.primaryText,
      marginLeft: 8,
      minWidth: 32,
      textAlign: 'right',
    },
  }), [colors]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Day Spent</Text>
      <View style={styles.barContainer}>
        <View style={[styles.barFill, { width: `${progress * 100}%` }]} />
      </View>
      <Text style={styles.percentage}>{Math.round(progress * 100)}%</Text>
    </View>
  );
}

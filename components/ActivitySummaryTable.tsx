import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useActivities } from '../contexts/ActivitiesContext';
import { SHADOWS } from '../constants/theme';

interface ActivitySummaryTableProps {
  hoursPerCategory: Record<string, number>;
}

export default function ActivitySummaryTable({ hoursPerCategory }: ActivitySummaryTableProps) {
  const { colors } = useTheme();
  const { sortedActivities, getActivityByCode } = useActivities();

  const getActivityCellStyle = (code: string, hours: number) => {
    const activity = getActivityByCode(code);
    if (!activity) return { backgroundColor: 'transparent', textColor: colors.primaryText };
    
    const points = activity.points;
    
    if (points < 0 && hours > 1) {
      return { backgroundColor: colors.error, textColor: '#FFFFFF' };
    }
    if (points >= 2 && hours >= 2) {
      return { backgroundColor: colors.success, textColor: '#FFFFFF' };
    }
    if (points > 0 && hours >= 1) {
      return { backgroundColor: colors.success, textColor: '#FFFFFF' };
    }
    return { backgroundColor: 'transparent', textColor: colors.primaryText };
  };

  const styles = useMemo(() => StyleSheet.create({
    container: {
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 16,
      marginHorizontal: 16,
      marginVertical: 8,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    title: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.primaryText,
      marginBottom: 12,
    },
    table: {
      borderRadius: 8,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.divider,
    },
    headerRow: {
      flexDirection: 'row',
      backgroundColor: colors.divider,
    },
    headerCell: {
      paddingVertical: 10,
      paddingHorizontal: 12,
      fontSize: 12,
      fontWeight: '600' as const,
      color: colors.secondaryText,
    },
    row: {
      flexDirection: 'row',
      borderTopWidth: 1,
      borderTopColor: colors.divider,
    },
    cell: {
      paddingVertical: 10,
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
    },
    activityCell: {
      flex: 2,
    },
    hoursCell: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    colorDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginRight: 8,
    },
    activityText: {
      fontSize: 13,
      fontWeight: '500' as const,
    },
    hoursText: {
      fontSize: 13,
      fontWeight: '600' as const,
      color: colors.primaryText,
      textAlign: 'right',
    },
  }), [colors]);

  const activitiesWithHours = useMemo(() => {
    return sortedActivities
      .filter(activity => {
        const hours = hoursPerCategory[activity.code] || 0;
        return hours > 0 || activity.isActive;
      })
      .sort((a, b) => {
        const hoursA = hoursPerCategory[a.code] || 0;
        const hoursB = hoursPerCategory[b.code] || 0;
        return hoursB - hoursA;
      });
  }, [sortedActivities, hoursPerCategory]);

  return (
    <View style={[styles.container, SHADOWS.card]}>
      <Text style={styles.title}>Daily Activity Summary</Text>
      <View style={styles.table}>
        <View style={styles.headerRow}>
          <Text style={[styles.headerCell, styles.activityCell]}>Activity</Text>
          <Text style={[styles.headerCell, styles.hoursCell]}>Hours</Text>
        </View>
        {activitiesWithHours.map((activity) => {
          const hours = hoursPerCategory[activity.code] || 0;
          const cellStyle = getActivityCellStyle(activity.code, hours);
          
          return (
            <View key={activity.id} style={styles.row}>
              <View style={[
                styles.cell, 
                styles.activityCell,
                { backgroundColor: cellStyle.backgroundColor }
              ]}>
                <View style={[styles.colorDot, { backgroundColor: activity.color }]} />
                <Text style={[styles.activityText, { color: cellStyle.textColor }]}>
                  {activity.name}
                </Text>
              </View>
              <View style={[styles.cell, styles.hoursCell]}>
                <Text style={styles.hoursText}>{hours.toFixed(2)}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

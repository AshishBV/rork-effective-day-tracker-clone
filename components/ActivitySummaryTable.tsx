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

  const getRowStatus = (code: string, hours: number): 'red' | 'green' | 'neutral' => {
    const redCodes = ['I', 'TW', 'CA'];
    if (redCodes.includes(code) && hours > 1) return 'red';

    if (code === 'A' && hours >= 2) return 'green';
    if ((code === 'P' || code === 'EC') && hours >= 1) return 'green';

    return 'neutral';
  };

  const getRowStyles = (status: 'red' | 'green' | 'neutral') => {
    switch (status) {
      case 'red':
        return {
          rowBg: 'rgba(220, 38, 38, 0.10)',
          indicatorColor: '#DC2626',
          textColor: colors.primaryText,
        };
      case 'green':
        return {
          rowBg: 'rgba(22, 163, 74, 0.10)',
          indicatorColor: '#16A34A',
          textColor: colors.primaryText,
        };
      default:
        return {
          rowBg: 'transparent',
          indicatorColor: 'transparent',
          textColor: colors.primaryText,
        };
    }
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
    statusIndicator: {
      width: 3,
      borderRadius: 2,
      marginRight: 0,
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
          const status = getRowStatus(activity.code, hours);
          const rowStyle = getRowStyles(status);
          
          return (
            <View key={activity.id} style={[styles.row, { backgroundColor: rowStyle.rowBg }]}>
              <View style={[styles.statusIndicator, { backgroundColor: rowStyle.indicatorColor }]} />
              <View style={[styles.cell, styles.activityCell]}>
                <View style={[styles.colorDot, { backgroundColor: activity.color }]} />
                <Text style={[styles.activityText, { color: rowStyle.textColor }]}>
                  {activity.name}
                </Text>
              </View>
              <View style={[styles.cell, styles.hoursCell]}>
                <Text style={[styles.hoursText, { color: rowStyle.textColor }]}>{hours.toFixed(2)}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

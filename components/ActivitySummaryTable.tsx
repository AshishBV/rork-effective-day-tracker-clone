import React, { useMemo, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useActivities } from '../contexts/ActivitiesContext';
import { useSelectedDay } from '../contexts/DataContext';
import { SHADOWS } from '../constants/theme';
import { TimeSlot } from '../types/data';

interface ActivitySummaryTableProps {
  hoursPerCategory: Record<string, number>;
}

interface SlotDetail {
  slotIndex: number;
  timeIn: string;
  timeOut: string;
  duration: number;
  description: string;
}

function ExpandableRow({
  activity,
  hours,
  status,
  slots,
  colors,
}: {
  activity: { id: string; code: string; name: string; color: string };
  hours: number;
  status: 'red' | 'green' | 'neutral';
  slots: SlotDetail[];
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  const [expanded, setExpanded] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const heightAnim = useRef(new Animated.Value(0)).current;

  const toggleExpand = useCallback(() => {
    if (hours <= 0 || slots.length === 0) return;
    const toExpanded = !expanded;
    setExpanded(toExpanded);

    Animated.parallel([
      Animated.spring(rotateAnim, {
        toValue: toExpanded ? 1 : 0,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.timing(heightAnim, {
        toValue: toExpanded ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  }, [expanded, hours, slots.length, rotateAnim, heightAnim]);

  const getRowStyles = (s: 'red' | 'green' | 'neutral') => {
    switch (s) {
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

  const rowStyle = getRowStyles(status);
  const canExpand = hours > 0 && slots.length > 0;

  const chevronRotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg'],
  });

  const expandHeight = heightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, slots.length * 34 + 4],
  });

  return (
    <View>
      <TouchableOpacity
        style={[styles.row, { backgroundColor: rowStyle.rowBg }]}
        onPress={toggleExpand}
        activeOpacity={canExpand ? 0.7 : 1}
        disabled={!canExpand}
      >
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
        {canExpand && (
          <Animated.View style={[styles.chevronContainer, { transform: [{ rotate: chevronRotation }] }]}>
            <ChevronRight size={14} color={colors.secondaryText} />
          </Animated.View>
        )}
      </TouchableOpacity>

      <Animated.View style={[styles.expandContainer, { maxHeight: expandHeight, overflow: 'hidden' }]}>
        {expanded && slots.map((slot, idx) => (
          <View key={`${slot.slotIndex}-${idx}`} style={styles.subRow}>
            <View style={styles.subIndicator} />
            <Text style={[styles.subCode, { color: colors.secondaryText }]}>{activity.code}</Text>
            <Text style={[styles.subDuration, { color: colors.secondaryText }]}>
              {slot.duration.toFixed(2)} hrs
            </Text>
            <Text
              style={[styles.subDescription, { color: colors.secondaryText }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {slot.description || `${slot.timeIn} → ${slot.timeOut}`}
            </Text>
          </View>
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 3,
    borderRadius: 2,
    alignSelf: 'stretch',
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
    textAlign: 'right' as const,
  },
  chevronContainer: {
    paddingRight: 10,
  },
  expandContainer: {
    paddingLeft: 3,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    paddingLeft: 20,
  },
  subIndicator: {
    width: 2,
    height: 16,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 1,
    marginRight: 10,
  },
  subCode: {
    fontSize: 11,
    fontWeight: '600' as const,
    width: 28,
  },
  subDuration: {
    fontSize: 11,
    fontWeight: '500' as const,
    width: 60,
  },
  subDescription: {
    fontSize: 11,
    flex: 1,
    fontStyle: 'italic' as const,
  },
});

export default function ActivitySummaryTable({ hoursPerCategory }: ActivitySummaryTableProps) {
  const { colors } = useTheme();
  const { sortedActivities } = useActivities();
  const selectedDay = useSelectedDay();

  const getRowStatus = (code: string, hours: number): 'red' | 'green' | 'neutral' => {
    const redCodes = ['I', 'TW', 'S', 'CA'];
    if (redCodes.includes(code) && hours > 1) return 'red';
    if (code === 'A' && hours >= 2) return 'green';
    if ((code === 'P' || code === 'EC') && hours >= 1) return 'green';
    return 'neutral';
  };

  const slotsByCategory = useMemo(() => {
    const result: Record<string, SlotDetail[]> = {};
    selectedDay.slots.forEach((slot: TimeSlot) => {
      if (!slot.activityCategory) return;
      const code = slot.activityCategory;
      if (!result[code]) result[code] = [];

      const [inH, inM] = slot.timeIn.split(':').map(Number);
      const [outH, outM] = slot.timeOut.split(':').map(Number);
      const durMinutes = (outH * 60 + outM) - (inH * 60 + inM);
      const duration = durMinutes > 0 ? durMinutes / 60 : 0.25;

      result[code].push({
        slotIndex: slot.index,
        timeIn: slot.timeIn,
        timeOut: slot.timeOut,
        duration,
        description: slot.performedActivityText || '',
      });
    });
    return result;
  }, [selectedDay.slots]);

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

  const containerStyles = useMemo(() => StyleSheet.create({
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
    headerActivityCell: {
      flex: 2,
    },
    headerHoursCell: {
      flex: 1,
    },
  }), [colors]);

  return (
    <View style={[containerStyles.container, SHADOWS.card]}>
      <Text style={containerStyles.title}>Daily Activity Summary</Text>
      <View style={containerStyles.table}>
        <View style={containerStyles.headerRow}>
          <Text style={[containerStyles.headerCell, containerStyles.headerActivityCell]}>Activity</Text>
          <Text style={[containerStyles.headerCell, containerStyles.headerHoursCell]}>Hours</Text>
        </View>
        {activitiesWithHours.map((activity) => {
          const hours = hoursPerCategory[activity.code] || 0;
          const status = getRowStatus(activity.code, hours);
          const categorySlots = slotsByCategory[activity.code] || [];
          
          return (
            <ExpandableRow
              key={activity.id}
              activity={activity}
              hours={hours}
              status={status}
              slots={categorySlots}
              colors={colors}
            />
          );
        })}
      </View>
    </View>
  );
}

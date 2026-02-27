import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useActivities } from '../contexts/ActivitiesContext';
import { GroupedSlot, getERColor } from '../utils/timeUtils';

interface ZoomedSlotRowProps {
  group: GroupedSlot;
  onPress: () => void;
  onLongPress: () => void;
}

export default function ZoomedSlotRow({ group, onPress, onLongPress }: ZoomedSlotRowProps) {
  const { colors, isDark } = useTheme();
  const { getActivityByCode } = useActivities();

  const erColor = getERColor(group.weightedER);
  const fillPercent = group.totalMinutes > 0 ? (group.filledMinutes / group.totalMinutes) * 100 : 0;
  const dominantActivity = group.dominantCategory ? getActivityByCode(group.dominantCategory) : null;

  const categoryBreakdown = useMemo(() => {
    const cats: Record<string, number> = {};
    for (const slot of group.slots) {
      if (slot.activityCategory) {
        const dur = parseInt(slot.timeOut.split(':')[0]) * 60 + parseInt(slot.timeOut.split(':')[1])
          - (parseInt(slot.timeIn.split(':')[0]) * 60 + parseInt(slot.timeIn.split(':')[1]));
        const safeDur = dur > 0 ? dur : 15;
        cats[slot.activityCategory] = (cats[slot.activityCategory] || 0) + safeDur;
      }
    }
    return Object.entries(cats).sort((a, b) => b[1] - a[1]);
  }, [group.slots]);

  const styles = useMemo(() => StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
      backgroundColor: colors.cardBackground,
      minHeight: 56,
    },
    timeBlock: {
      width: 110,
    },
    timeRange: {
      fontSize: 13,
      fontWeight: '700' as const,
      color: colors.primaryText,
      fontVariant: ['tabular-nums'],
    },
    durationLabel: {
      fontSize: 11,
      color: colors.secondaryText,
      marginTop: 2,
    },
    erBlock: {
      width: 52,
      alignItems: 'center',
    },
    erBadge: {
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: 8,
    },
    erText: {
      fontSize: 13,
      fontWeight: '800' as const,
      color: '#FFFFFF',
    },
    centerBlock: {
      flex: 1,
      marginLeft: 10,
    },
    categoryPills: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
    },
    miniPill: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    miniPillText: {
      fontSize: 10,
      fontWeight: '700' as const,
    },
    fillBar: {
      height: 4,
      borderRadius: 2,
      backgroundColor: isDark ? '#333333' : '#E5E7EB',
      marginTop: 6,
      overflow: 'hidden',
    },
    fillProgress: {
      height: 4,
      borderRadius: 2,
    },
    emptyLabel: {
      fontSize: 12,
      color: colors.secondaryText,
      fontStyle: 'italic',
    },
  }), [colors, isDark]);

  const durationText = group.totalMinutes >= 60
    ? `${Math.floor(group.totalMinutes / 60)}h${group.totalMinutes % 60 > 0 ? ` ${group.totalMinutes % 60}m` : ''}`
    : `${group.totalMinutes}m`;

  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      <View style={styles.timeBlock}>
        <Text style={styles.timeRange}>{group.timeIn} – {group.timeOut}</Text>
        <Text style={styles.durationLabel}>{durationText}</Text>
      </View>

      <View style={styles.erBlock}>
        {group.filledMinutes > 0 ? (
          <View style={[styles.erBadge, { backgroundColor: erColor }]}>
            <Text style={styles.erText}>{group.weightedER.toFixed(2)}</Text>
          </View>
        ) : (
          <View style={[styles.erBadge, { backgroundColor: isDark ? '#333' : '#E5E7EB' }]}>
            <Text style={[styles.erText, { color: colors.secondaryText }]}>—</Text>
          </View>
        )}
      </View>

      <View style={styles.centerBlock}>
        {categoryBreakdown.length > 0 ? (
          <>
            <View style={styles.categoryPills}>
              {categoryBreakdown.slice(0, 4).map(([code]) => {
                const act = getActivityByCode(code);
                if (!act) return null;
                return (
                  <View key={code} style={[styles.miniPill, { backgroundColor: act.color }]}>
                    <Text style={[styles.miniPillText, { color: act.textColor }]}>{act.code}</Text>
                  </View>
                );
              })}
            </View>
            <View style={styles.fillBar}>
              <View style={[styles.fillProgress, { width: `${fillPercent}%`, backgroundColor: erColor }]} />
            </View>
          </>
        ) : (
          <Text style={styles.emptyLabel}>No activity logged</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

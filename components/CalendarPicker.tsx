import React, { useState, useMemo, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TouchableOpacity, 
  Pressable,
  ScrollView,
  Animated,
} from 'react-native';
import { ChevronLeft, ChevronRight, ChevronDown, TrendingUp, CheckCircle } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { SHADOWS } from '../constants/theme';
import { DayData, Habit, DEFAULT_HABITS } from '../types/data';
import { calculateDayER, getDateKey } from '../utils/timeUtils';
import { useActivities } from '../contexts/ActivitiesContext';

interface CalendarPickerProps {
  selectedDate: string;
  onSelectDate: (dateKey: string) => void;
  days: Record<string, DayData>;
  activeHabits?: Habit[];
  hideSummary?: boolean;
}

export default function CalendarPicker({ selectedDate, onSelectDate, days, activeHabits, hideSummary = false }: CalendarPickerProps) {
  const { colors } = useTheme();
  const { activities } = useActivities();
  const habits = activeHabits || DEFAULT_HABITS;
  const [visible, setVisible] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date(selectedDate + 'T12:00:00');
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const overlayOpacity = useMemo(() => new Animated.Value(0), []);
  const containerTranslateY = useMemo(() => new Animated.Value(-20), []);
  const containerOpacity = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(containerTranslateY, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(containerOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      overlayOpacity.setValue(0);
      containerTranslateY.setValue(-20);
      containerOpacity.setValue(0);
    }
  }, [visible, overlayOpacity, containerTranslateY, containerOpacity]);

  const displayDate = new Date(selectedDate + 'T12:00:00');
  const formattedDate = `${displayDate.getDate()} ${displayDate.toLocaleString('en-US', { month: 'long' })} ${displayDate.getFullYear()}`;

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

  const calendarData = useMemo(() => {
    const year = viewMonth.year;
    const month = viewMonth.month;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const weeks: { 
      day: number | null; 
      dateKey: string | null; 
      er: number | null; 
      habitsCompleted: number;
      habitsTotal: number;
      isToday: boolean; 
      isSelected: boolean 
    }[][] = [];
    let currentWeek: typeof weeks[0] = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      currentWeek.push({ day: null, dateKey: null, er: null, habitsCompleted: 0, habitsTotal: 0, isToday: false, isSelected: false });
    }

    const today = getDateKey(new Date());

    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayData = days[dateKey];
      let er: number | null = null;
      let habitsCompleted = 0;
      const habitsTotal = habits.filter(h => h.active).length;
      
      if (dayData) {
        const filledCount = dayData.slots.filter(s => s.activityCategory !== null).length;
        if (filledCount > 0) {
          er = calculateDayER(dayData.slots, activities);
        }
        habitsCompleted = habits.filter(h => h.active && dayData.habitCompletions?.[h.id]).length;
      }

      currentWeek.push({
        day: d,
        dateKey,
        er,
        habitsCompleted,
        habitsTotal,
        isToday: dateKey === today,
        isSelected: dateKey === selectedDate,
      });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push({ day: null, dateKey: null, er: null, habitsCompleted: 0, habitsTotal: 0, isToday: false, isSelected: false });
      }
      weeks.push(currentWeek);
    }

    return weeks;
  }, [viewMonth, days, selectedDate, habits, activities]);

  const monthName = new Date(viewMonth.year, viewMonth.month).toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const navigateMonth = (direction: number) => {
    setViewMonth(prev => {
      let newMonth = prev.month + direction;
      let newYear = prev.year;
      if (newMonth < 0) {
        newMonth = 11;
        newYear--;
      } else if (newMonth > 11) {
        newMonth = 0;
        newYear++;
      }
      return { year: newYear, month: newMonth };
    });
  };

  const handleSelectDate = (dateKey: string) => {
    onSelectDate(dateKey);
    setVisible(false);
  };

  const getERColor = (er: number | null) => {
    if (er === null) return colors.secondaryText;
    if (er >= 0.8) return colors.success;
    if (er >= 0.5) return colors.highlight;
    return colors.error;
  };

  const styles = useMemo(() => StyleSheet.create({
    dateButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 8,
      paddingHorizontal: 16,
    },
    dateText: {
      fontSize: 22,
      fontWeight: '700' as const,
      color: colors.primaryText,
    },
    daySummaryCard: {
      marginHorizontal: 16,
      marginTop: 8,
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
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    overlayPressable: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    container: {
      backgroundColor: colors.cardBackground,
      borderRadius: 20,
      width: '100%',
      maxWidth: 360,
      maxHeight: '80%',
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    navBtn: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: colors.divider,
    },
    monthText: {
      fontSize: 17,
      fontWeight: '600' as const,
      color: colors.primaryText,
    },
    weekDaysRow: {
      flexDirection: 'row',
      paddingHorizontal: 8,
      paddingTop: 12,
      paddingBottom: 8,
    },
    weekDayText: {
      flex: 1,
      textAlign: 'center',
      fontSize: 12,
      fontWeight: '600' as const,
      color: colors.secondaryText,
    },
    calendarBody: {
      paddingHorizontal: 8,
    },
    weekRow: {
      flexDirection: 'row',
      marginBottom: 4,
    },
    dayCell: {
      flex: 1,
      aspectRatio: 1,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 8,
      margin: 2,
    },
    todayCell: {
      backgroundColor: colors.divider,
    },
    selectedCell: {
      backgroundColor: colors.highlight,
    },
    dayNumber: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.primaryText,
    },
    selectedDayNumber: {
      color: '#FFFFFF',
    },
    erLabel: {
      fontSize: 9,
      fontWeight: '700' as const,
      marginTop: 2,
    },
    habitsLabel: {
      fontSize: 9,
      fontWeight: '600' as const,
      marginTop: 1,
      paddingHorizontal: 4,
      paddingVertical: 1,
      borderRadius: 4,
      overflow: 'hidden',
    },
    habitsBadge: {
      backgroundColor: 'rgba(100,100,100,0.3)',
    },
    habitsBadgeDark: {
      backgroundColor: 'rgba(255,255,255,0.2)',
    },
    habitsTextDefault: {
      color: colors.primaryText,
    },
    habitsComplete: {
      color: colors.success,
      fontWeight: '700' as const,
    },
    todayButton: {
      margin: 16,
      paddingVertical: 12,
      borderRadius: 10,
      backgroundColor: colors.highlight,
      alignItems: 'center',
    },
    todayButtonText: {
      fontSize: 15,
      fontWeight: '600' as const,
      color: '#FFFFFF',
    },
  }), [colors]);

  return (
    <>
      <TouchableOpacity style={styles.dateButton} onPress={() => setVisible(true)}>
        <Text style={styles.dateText}>{formattedDate}</Text>
        <ChevronDown size={20} color={colors.primaryText} />
      </TouchableOpacity>

      {!hideSummary && (
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
      )}

      <Modal
        visible={visible}
        animationType="none"
        transparent
        onRequestClose={() => setVisible(false)}
      >
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
          <Pressable style={styles.overlayPressable} onPress={() => setVisible(false)} />
          <Animated.View 
            style={[
              styles.container, 
              SHADOWS.card,
              { 
                opacity: containerOpacity,
                transform: [{ translateY: containerTranslateY }]
              }
            ]}
          >
            <View style={styles.header}>
              <TouchableOpacity style={styles.navBtn} onPress={() => navigateMonth(-1)}>
                <ChevronLeft size={22} color={colors.primaryText} />
              </TouchableOpacity>
              <Text style={styles.monthText}>{monthName}</Text>
              <TouchableOpacity style={styles.navBtn} onPress={() => navigateMonth(1)}>
                <ChevronRight size={22} color={colors.primaryText} />
              </TouchableOpacity>
            </View>

            <View style={styles.weekDaysRow}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <Text key={i} style={styles.weekDayText}>{day}</Text>
              ))}
            </View>

            <ScrollView style={styles.calendarBody} showsVerticalScrollIndicator={false}>
              {calendarData.map((week, wi) => (
                <View key={wi} style={styles.weekRow}>
                  {week.map((cell, ci) => (
                    <TouchableOpacity
                      key={ci}
                      style={[
                        styles.dayCell,
                        cell.isToday && styles.todayCell,
                        cell.isSelected && styles.selectedCell,
                      ]}
                      onPress={() => cell.dateKey && handleSelectDate(cell.dateKey)}
                      disabled={!cell.dateKey}
                    >
                      {cell.day !== null && (
                        <>
                          <Text style={[
                            styles.dayNumber,
                            cell.isSelected && styles.selectedDayNumber,
                          ]}>
                            {cell.day}
                          </Text>
                          {cell.er !== null && (
                            <Text style={[styles.erLabel, { color: getERColor(cell.er) }]}>
                              {cell.er.toFixed(2)}
                            </Text>
                          )}
                          {cell.habitsTotal > 0 && (
                            <Text style={[
                              styles.habitsLabel,
                              styles.habitsBadge,
                              cell.isSelected ? styles.habitsBadgeDark : null,
                              cell.habitsCompleted === cell.habitsTotal && cell.habitsCompleted > 0 
                                ? styles.habitsComplete 
                                : styles.habitsTextDefault,
                            ]}>
                              {cell.habitsCompleted}/{cell.habitsTotal}
                            </Text>
                          )}
                        </>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity 
              style={styles.todayButton} 
              onPress={() => handleSelectDate(getDateKey(new Date()))}
            >
              <Text style={styles.todayButtonText}>Go to Today</Text>
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </Modal>
    </>
  );
}

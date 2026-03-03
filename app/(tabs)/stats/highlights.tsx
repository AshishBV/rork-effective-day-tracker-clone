import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { BookOpen } from 'lucide-react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../../contexts/ThemeContext';
import { useData } from '../../../contexts/DataContext';
import { SHADOWS } from '../../../constants/theme';

export default function HighlightsScreen() {
  const { colors } = useTheme();
  const { days } = useData();
  const { year, month } = useLocalSearchParams<{ year: string; month: string }>();

  const currentYear = parseInt(year || new Date().getFullYear().toString(), 10);
  const currentMonth = parseInt(month || new Date().getMonth().toString(), 10);

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const monthName = new Date(currentYear, currentMonth).toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const highlightDays = useMemo(() => {
    const result: { dateKey: string; date: Date; highlights: string[] }[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayData = days[dateKey];
      if (!dayData?.highlights) continue;
      const filled = dayData.highlights.filter((h: string) => h && h.trim().length > 0);
      if (filled.length === 0) continue;
      result.push({ dateKey, date: new Date(currentYear, currentMonth, d), highlights: filled });
    }
    return result;
  }, [days, currentYear, currentMonth, daysInMonth]);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      fontSize: 18,
      fontWeight: '600' as const,
      color: colors.primaryText,
      textAlign: 'center',
      paddingVertical: 16,
    },
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 80,
      gap: 12,
    },
    emptyText: {
      fontSize: 14,
      color: colors.secondaryText,
      fontStyle: 'italic',
    },
    journalCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 14,
      padding: 16,
      marginHorizontal: 16,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    journalDateText: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.highlight,
      marginBottom: 10,
      letterSpacing: 0.2,
    },
    journalHighlightRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 6,
      paddingLeft: 4,
    },
    journalBullet: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.highlight,
      marginTop: 6,
      marginRight: 10,
      opacity: 0.6,
    },
    journalHighlightText: {
      fontSize: 14,
      color: colors.primaryText,
      lineHeight: 20,
      flex: 1,
    },
    journalDivider: {
      width: 1,
      height: 16,
      backgroundColor: colors.divider,
      alignSelf: 'center',
      marginVertical: 2,
    },
  }), [colors]);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.header}>{monthName}</Text>

        {highlightDays.length === 0 ? (
          <View style={styles.emptyContainer}>
            <BookOpen size={24} color={colors.secondaryText} style={{ opacity: 0.5 }} />
            <Text style={styles.emptyText}>No highlights recorded this month</Text>
          </View>
        ) : (
          highlightDays.map((entry, idx) => {
            const dayLabel = entry.date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
            return (
              <View key={entry.dateKey}>
                <View style={[styles.journalCard, SHADOWS.card]}>
                  <Text style={styles.journalDateText}>{dayLabel}</Text>
                  {entry.highlights.map((h, i) => (
                    <View key={i} style={styles.journalHighlightRow}>
                      <View style={styles.journalBullet} />
                      <Text style={styles.journalHighlightText}>{h}</Text>
                    </View>
                  ))}
                </View>
                {idx < highlightDays.length - 1 && (
                  <View style={styles.journalDivider} />
                )}
              </View>
            );
          })
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

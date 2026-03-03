import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { ChevronLeft, ChevronRight, Maximize2, BookOpen } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../../contexts/ThemeContext';
import { useActivities } from '../../../contexts/ActivitiesContext';
import { SHADOWS, CHART_THEMES } from '../../../constants/theme';
import { useData } from '../../../contexts/DataContext';
import { getHoursPerCategory, getSlotErPoints, calculateDayER } from '../../../utils/timeUtils';
import LineChart from '../../../components/charts/LineChart';
import BarChart from '../../../components/charts/BarChart';
import ChartLandscapeModal from '../../../components/ChartLandscapeModal';


const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 64;
const LANDSCAPE_WIDTH = Math.max(SCREEN_WIDTH, SCREEN_HEIGHT) - 80;
const LANDSCAPE_HEIGHT = Math.min(SCREEN_WIDTH, SCREEN_HEIGHT) - 100;

const WEEK_BUCKETS = [
  { start: 1, end: 7, label: '1st-7th' },
  { start: 8, end: 14, label: '8th-14th' },
  { start: 15, end: 21, label: '15th-21st' },
  { start: 22, end: 28, label: '22nd-28th' },
  { start: 29, end: 31, label: '29th-end' },
];

type ChartType = 'tef' | 'habits' | 'sleep' | 'steps' | 'weeklyTef' | 'weeklySleep' | 'weeklySteps' | 'weeklyActivity';

export default function StatsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { days, settings, getActiveHabits } = useData();
  const { activities, getActivityByCode } = useActivities();
  const activeHabits = useMemo(() => getActiveHabits(), [getActiveHabits]);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [landscapeChart, setLandscapeChart] = useState<ChartType | null>(null);
  const [landscapeWeekIndex, setLandscapeWeekIndex] = useState<number>(0);

  const navigateMonth = (direction: number) => {
    setCurrentMonth(prev => {
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

  const monthName = new Date(currentMonth.year, currentMonth.month).toLocaleString('en-US', { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(currentMonth.year, currentMonth.month + 1, 0).getDate();

  const monthData = useMemo(() => {
    const data: { day: number; er: number | null; habits: number | null; sleep: number | null; steps: number | null; hours: Record<string, number> }[] = [];
    
    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${currentMonth.year}-${String(currentMonth.month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayData = days[dateKey];
      
      if (dayData) {
        const filledSlots = dayData.slots.filter(s => s.activityCategory !== null);
        const er = filledSlots.length > 0 ? calculateDayER(dayData.slots, activities) : null;
        const hours = getHoursPerCategory(dayData.slots);
        
        const totalActiveHabits = activeHabits.length;
        const completedHabits = totalActiveHabits > 0 
          ? activeHabits.filter(h => dayData.habitCompletions?.[h.id]).length 
          : 0;
        const hasHabitData = dayData.habitCompletions && Object.keys(dayData.habitCompletions).length > 0;
        
        data.push({
          day: d,
          er: filledSlots.length > 0 ? er : null,
          habits: hasHabitData ? completedHabits : null,
          sleep: dayData.sleepHours,
          steps: dayData.steps,
          hours,
        });
      } else {
        data.push({
          day: d,
          er: null,
          habits: null,
          sleep: null,
          steps: null,
          hours: {} as Record<string, number>,
        });
      }
    }
    return data;
  }, [days, currentMonth, daysInMonth, activeHabits, activities]);

  const erData = monthData.map(d => ({ x: d.day, y: d.er }));
  const habitData = monthData.map(d => ({ x: d.day, y: d.habits || 0 }));
  const sleepData = monthData.map(d => ({ x: d.day, y: d.sleep }));
  const stepsData = monthData.map(d => ({ x: d.day, y: d.steps }));

  const weeklyAverages = useMemo(() => {
    const activityCodes = activities.map(a => a.code);
    
    return WEEK_BUCKETS.map(bucket => {
      const bucketDays = monthData.filter(d => d.day >= bucket.start && d.day <= Math.min(bucket.end, daysInMonth));
      const validER = bucketDays.filter(d => d.er !== null);
      const validSleep = bucketDays.filter(d => d.sleep !== null);
      const validSteps = bucketDays.filter(d => d.steps !== null);

      const avgER = validER.length > 0 ? validER.reduce((sum, d) => sum + (d.er || 0), 0) / validER.length : 0;
      const avgSleep = validSleep.length > 0 ? validSleep.reduce((sum, d) => sum + (d.sleep || 0), 0) / validSleep.length : 0;
      const avgSteps = validSteps.length > 0 ? validSteps.reduce((sum, d) => sum + (d.steps || 0), 0) / validSteps.length : 0;

      const categoryHours: Record<string, number[]> = {};
      activityCodes.forEach(code => { categoryHours[code] = []; });
      
      bucketDays.forEach(d => {
        Object.keys(d.hours).forEach(code => {
          if (!categoryHours[code]) categoryHours[code] = [];
          if (d.hours[code]) categoryHours[code].push(d.hours[code]);
        });
      });

      const avgHours: { key: string; avg: number; color: string }[] = Object.keys(categoryHours)
        .map(code => {
          const activity = getActivityByCode(code);
          return {
            key: code,
            avg: categoryHours[code].length > 0 
              ? categoryHours[code].reduce((a, b) => a + b, 0) / categoryHours[code].length 
              : 0,
            color: activity?.color || '#666666',
          };
        })
        .filter(h => h.avg > 0)
        .sort((a, b) => b.avg - a.avg);

      return { label: bucket.label, avgER, avgSleep, avgSteps, avgHours };
    }).filter(b => b.label !== '29th-end' || daysInMonth > 28);
  }, [monthData, daysInMonth, activities, getActivityByCode]);

  const insights = useMemo(() => {
    const daysByWeekday: Record<number, number[]> = { 0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    
    Object.entries(days).forEach(([dateKey, dayData]) => {
      const date = new Date(dateKey + 'T12:00:00');
      if (date.getFullYear() === currentMonth.year && date.getMonth() === currentMonth.month) {
        const filledSlots = dayData.slots.filter(s => s.activityCategory !== null);
        if (filledSlots.length > 0) {
          const er = calculateDayER(dayData.slots, activities);
          daysByWeekday[date.getDay()].push(er);
        }
      }
    });

    const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekdayAverages = Object.entries(daysByWeekday)
      .map(([day, ers]) => ({
        day: parseInt(day),
        name: weekdayNames[parseInt(day)],
        avg: ers.length > 0 ? ers.reduce((a, b) => a + b, 0) / ers.length : null,
        count: ers.length,
      }))
      .filter(w => w.avg !== null);

    const bestWeekday = weekdayAverages.length > 0 
      ? weekdayAverages.reduce((best, curr) => (curr.avg || 0) > (best.avg || 0) ? curr : best)
      : null;

    const validDays = monthData.filter(d => d.er !== null && d.sleep !== null);
    let sleepCorrelation = null;
    if (validDays.length >= 7) {
      const n = validDays.length;
      const sumX = validDays.reduce((s, d) => s + (d.sleep || 0), 0);
      const sumY = validDays.reduce((s, d) => s + (d.er || 0), 0);
      const sumXY = validDays.reduce((s, d) => s + (d.sleep || 0) * (d.er || 0), 0);
      const sumX2 = validDays.reduce((s, d) => s + Math.pow(d.sleep || 0, 2), 0);
      const sumY2 = validDays.reduce((s, d) => s + Math.pow(d.er || 0, 2), 0);
      
      const num = n * sumXY - sumX * sumY;
      const den = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
      sleepCorrelation = den !== 0 ? num / den : 0;
    }

    const stepsValidDays = monthData.filter(d => d.er !== null && d.steps !== null);
    let stepsCorrelation = null;
    if (stepsValidDays.length >= 7) {
      const n = stepsValidDays.length;
      const sumX = stepsValidDays.reduce((s, d) => s + (d.steps || 0), 0);
      const sumY = stepsValidDays.reduce((s, d) => s + (d.er || 0), 0);
      const sumXY = stepsValidDays.reduce((s, d) => s + (d.steps || 0) * (d.er || 0), 0);
      const sumX2 = stepsValidDays.reduce((s, d) => s + Math.pow(d.steps || 0, 2), 0);
      const sumY2 = stepsValidDays.reduce((s, d) => s + Math.pow(d.er || 0, 2), 0);
      
      const num = n * sumXY - sumX * sumY;
      const den = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
      stepsCorrelation = den !== 0 ? num / den : 0;
    }

    return { bestWeekday, weekdayAverages, sleepCorrelation, stepsCorrelation };
  }, [days, monthData, currentMonth, activities]);

  const openLandscape = (type: ChartType, weekIndex?: number) => {
    setLandscapeChart(type);
    if (weekIndex !== undefined) setLandscapeWeekIndex(weekIndex);
  };

  const renderLandscapeContent = () => {
    switch (landscapeChart) {
      case 'tef':
        return (
          <LineChart
            data={erData}
            yLabel="TEF"
            yMin={0}
            yMax={1}
            yStep={0.1}
            goalLine={settings.erGoal / 100}
            lineColor={CHART_THEMES.tef.lineColor}
            backgroundColor={CHART_THEMES.tef.background}
            goalColor={CHART_THEMES.tef.goalColor}
            width={LANDSCAPE_WIDTH}
            height={LANDSCAPE_HEIGHT}
            showValues
            valueFormatter={(v) => `${Math.round(v * 100)}%`}
          />
        );
      case 'habits': {
        const totalHabits = Math.max(activeHabits.length, 1);
        return (
          <BarChart
            data={habitData.map(d => ({ x: d.x, y: d.y || 0 }))}
            yLabel="Habits"
            yMin={0}
            yMax={totalHabits}
            yStep={totalHabits <= 5 ? 1 : Math.ceil(totalHabits / 5)}
            barColor={CHART_THEMES.habits.barColor}
            backgroundColor={CHART_THEMES.habits.background}
            width={LANDSCAPE_WIDTH}
            height={LANDSCAPE_HEIGHT}
            showValues
          />
        );
      }
      case 'sleep':
        return (
          <LineChart
            data={sleepData}
            yLabel="Sleep Hours"
            yMin={0}
            yMax={10}
            yStep={1}
            goalLine={settings.sleepGoal}
            lineColor={CHART_THEMES.sleep.lineColor}
            backgroundColor={CHART_THEMES.sleep.background}
            goalColor={CHART_THEMES.sleep.goalColor}
            width={LANDSCAPE_WIDTH}
            height={LANDSCAPE_HEIGHT}
            showValues
            valueFormatter={(v) => `${v}h`}
          />
        );
      case 'steps':
        return (
          <LineChart
            data={stepsData}
            yLabel="Steps"
            yMin={0}
            yMax={12000}
            yStep={1000}
            goalLine={settings.stepsGoal}
            lineColor={CHART_THEMES.steps.lineColor}
            backgroundColor={CHART_THEMES.steps.background}
            goalColor={CHART_THEMES.steps.goalColor}
            width={LANDSCAPE_WIDTH}
            height={LANDSCAPE_HEIGHT}
            showValues
            valueFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(1)}k` : `${v}`}
          />
        );
      case 'weeklyTef':
        return (
          <BarChart
            data={weeklyAverages.map(w => ({ x: w.label, y: w.avgER, label: w.label }))}
            yLabel="Avg TEF"
            yMin={0}
            yMax={1}
            yStep={0.2}
            showValues
            barColor={CHART_THEMES.weeklyTef.barColor}
            backgroundColor={CHART_THEMES.weeklyTef.background}
            width={LANDSCAPE_WIDTH}
            height={LANDSCAPE_HEIGHT}
          />
        );
      case 'weeklySleep':
        return (
          <BarChart
            data={weeklyAverages.map(w => ({ x: w.label, y: w.avgSleep, label: w.label }))}
            yLabel="Avg Hours"
            yMin={0}
            yMax={10}
            yStep={2}
            showValues
            barColor={CHART_THEMES.weeklySleep.barColor}
            backgroundColor={CHART_THEMES.weeklySleep.background}
            width={LANDSCAPE_WIDTH}
            height={LANDSCAPE_HEIGHT}
          />
        );
      case 'weeklySteps':
        return (
          <BarChart
            data={weeklyAverages.map(w => ({ x: w.label, y: w.avgSteps, label: w.label }))}
            yLabel="Avg Steps"
            yMin={0}
            yMax={12000}
            yStep={2000}
            showValues
            barColor={CHART_THEMES.weeklySteps.barColor}
            backgroundColor={CHART_THEMES.weeklySteps.background}
            width={LANDSCAPE_WIDTH}
            height={LANDSCAPE_HEIGHT}
          />
        );
      case 'weeklyActivity':
        const week = weeklyAverages[landscapeWeekIndex];
        if (!week || week.avgHours.length === 0) return null;
        return (
          <BarChart
            data={week.avgHours.map(h => ({ 
              x: h.key, 
              y: h.avg, 
              color: h.color,
              label: h.key
            }))}
            yLabel="Hours"
            yMin={0}
            yMax={Math.max(6, ...week.avgHours.map(h => Math.ceil(h.avg)))}
            yStep={1}
            showValues
            width={LANDSCAPE_WIDTH}
            height={LANDSCAPE_HEIGHT}
          />
        );
      default:
        return null;
    }
  };

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    monthNav: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    navButton: {
      padding: 8,
      borderRadius: 8,
      backgroundColor: colors.divider,
    },
    monthText: {
      fontSize: 18,
      fontWeight: '600' as const,
      color: colors.primaryText,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.primaryText,
      marginLeft: 16,
      marginTop: 24,
      marginBottom: 12,
    },
    chartCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 16,
      marginHorizontal: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    chartHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    chartTitle: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.primaryText,
    },
    insightCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 16,
      marginHorizontal: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    insightTitle: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.primaryText,
      marginBottom: 8,
    },
    insightValue: {
      fontSize: 20,
      fontWeight: '700' as const,
      color: colors.highlight,
      marginBottom: 4,
    },
    insightNote: {
      fontSize: 12,
      color: colors.secondaryText,
      fontStyle: 'italic',
    },
    insightNoData: {
      fontSize: 13,
      color: colors.secondaryText,
    },
    weekdayList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 8,
    },
    weekdayItem: {
      fontSize: 12,
      color: colors.secondaryText,
      backgroundColor: colors.divider,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
    },
    journalNavRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 16,
      marginHorizontal: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    journalNavIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
    },
    journalNavContent: {
      flex: 1,
    },
    journalNavTitle: {
      fontSize: 16,
      fontWeight: '500' as const,
      color: colors.primaryText,
    },
    journalNavSubtitle: {
      fontSize: 13,
      color: colors.secondaryText,
      marginTop: 2,
    },
  }), [colors]);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.monthNav}>
        <TouchableOpacity style={styles.navButton} onPress={() => navigateMonth(-1)}>
          <ChevronLeft size={24} color={colors.primaryText} />
        </TouchableOpacity>
        <Text style={styles.monthText}>{monthName}</Text>
        <TouchableOpacity style={styles.navButton} onPress={() => navigateMonth(1)}>
          <ChevronRight size={24} color={colors.primaryText} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={[styles.chartCard, SHADOWS.card]} onPress={() => openLandscape('tef')}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Effective Ratio vs Days</Text>
          <Maximize2 size={16} color={colors.secondaryText} />
        </View>
        <LineChart
          data={erData}
          yLabel="TEF"
          yMin={0}
          yMax={1}
          yStep={0.1}
          goalLine={settings.erGoal}
          lineColor={CHART_THEMES.tef.lineColor}
          backgroundColor={CHART_THEMES.tef.background}
          goalColor={CHART_THEMES.tef.goalColor}
          width={CHART_WIDTH}
          height={200}
        />
      </TouchableOpacity>

      <TouchableOpacity style={[styles.chartCard, SHADOWS.card]} onPress={() => openLandscape('habits')}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Habit Score vs Days</Text>
          <Maximize2 size={16} color={colors.secondaryText} />
        </View>
        <BarChart
          data={habitData.map(d => ({ x: d.x, y: d.y || 0 }))}
          yLabel="Habits"
          yMin={0}
          yMax={Math.max(activeHabits.length, 1)}
          yStep={activeHabits.length <= 5 ? 1 : Math.ceil(activeHabits.length / 5)}
          barColor={CHART_THEMES.habits.barColor}
          backgroundColor={CHART_THEMES.habits.background}
          width={CHART_WIDTH}
          height={200}
        />
      </TouchableOpacity>

      <TouchableOpacity style={[styles.chartCard, SHADOWS.card]} onPress={() => openLandscape('sleep')}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Sleep vs Days</Text>
          <Maximize2 size={16} color={colors.secondaryText} />
        </View>
        <LineChart
          data={sleepData}
          yLabel="Sleep Hours"
          yMin={0}
          yMax={10}
          yStep={1}
          goalLine={settings.sleepGoal}
          lineColor={CHART_THEMES.sleep.lineColor}
          backgroundColor={CHART_THEMES.sleep.background}
          goalColor={CHART_THEMES.sleep.goalColor}
          width={CHART_WIDTH}
          height={200}
        />
      </TouchableOpacity>

      <TouchableOpacity style={[styles.chartCard, SHADOWS.card]} onPress={() => openLandscape('steps')}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Steps vs Days</Text>
          <Maximize2 size={16} color={colors.secondaryText} />
        </View>
        <LineChart
          data={stepsData}
          yLabel="Steps"
          yMin={0}
          yMax={12000}
          yStep={2000}
          goalLine={settings.stepsGoal}
          lineColor={CHART_THEMES.steps.lineColor}
          backgroundColor={CHART_THEMES.steps.background}
          goalColor={CHART_THEMES.steps.goalColor}
          width={CHART_WIDTH}
          height={200}
        />
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Weekly Averages</Text>

      <TouchableOpacity style={[styles.chartCard, SHADOWS.card]} onPress={() => openLandscape('weeklyTef')}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Average TEF per Week</Text>
          <Maximize2 size={16} color={colors.secondaryText} />
        </View>
        <BarChart
          data={weeklyAverages.map(w => ({ x: w.label, y: w.avgER, label: w.label }))}
          yLabel="Avg TEF"
          yMin={0}
          yMax={1}
          yStep={0.2}
          showValues
          barColor={CHART_THEMES.weeklyTef.barColor}
          backgroundColor={CHART_THEMES.weeklyTef.background}
          width={CHART_WIDTH}
          height={180}
        />
      </TouchableOpacity>

      <TouchableOpacity style={[styles.chartCard, SHADOWS.card]} onPress={() => openLandscape('weeklySleep')}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Average Sleep per Week</Text>
          <Maximize2 size={16} color={colors.secondaryText} />
        </View>
        <BarChart
          data={weeklyAverages.map(w => ({ x: w.label, y: w.avgSleep, label: w.label }))}
          yLabel="Avg Hours"
          yMin={0}
          yMax={10}
          yStep={2}
          showValues
          barColor={CHART_THEMES.weeklySleep.barColor}
          backgroundColor={CHART_THEMES.weeklySleep.background}
          width={CHART_WIDTH}
          height={180}
        />
      </TouchableOpacity>

      <TouchableOpacity style={[styles.chartCard, SHADOWS.card]} onPress={() => openLandscape('weeklySteps')}>
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>Average Steps per Week</Text>
          <Maximize2 size={16} color={colors.secondaryText} />
        </View>
        <BarChart
          data={weeklyAverages.map(w => ({ x: w.label, y: w.avgSteps, label: w.label }))}
          yLabel="Avg Steps"
          yMin={0}
          yMax={12000}
          yStep={2000}
          showValues
          barColor={CHART_THEMES.weeklySteps.barColor}
          backgroundColor={CHART_THEMES.weeklySteps.background}
          width={CHART_WIDTH}
          height={180}
        />
      </TouchableOpacity>

      {weeklyAverages.map((week, index) => (
        week.avgHours.length > 0 && (
          <TouchableOpacity 
            key={index} 
            style={[styles.chartCard, SHADOWS.card]}
            onPress={() => openLandscape('weeklyActivity', index)}
          >
            <View style={styles.chartHeader}>
              <Text style={styles.chartTitle}>Avg Hours per Activity ({week.label})</Text>
              <Maximize2 size={16} color={colors.secondaryText} />
            </View>
            <BarChart
              data={week.avgHours.map(h => ({ 
                x: h.key, 
                y: h.avg, 
                color: h.color,
                label: h.key
              }))}
              yLabel="Hours"
              yMin={0}
              yMax={Math.max(6, ...week.avgHours.map(h => Math.ceil(h.avg)))}
              yStep={1}
              showValues
              width={CHART_WIDTH}
              height={160}
            />
          </TouchableOpacity>
        )
      ))}

      <Text style={styles.sectionTitle}>Insights</Text>

      <View style={[styles.insightCard, SHADOWS.card]}>
        <Text style={styles.insightTitle}>Best Weekday by TEF</Text>
        {insights.bestWeekday ? (
          <>
            <Text style={styles.insightValue}>
              {insights.bestWeekday.name}: {((insights.bestWeekday.avg || 0) * 100).toFixed(0)}%
            </Text>
            <View style={styles.weekdayList}>
              {insights.weekdayAverages.map(w => (
                <Text key={w.day} style={styles.weekdayItem}>
                  {w.name}: {((w.avg || 0) * 100).toFixed(0)}%
                </Text>
              ))}
            </View>
          </>
        ) : (
          <Text style={styles.insightNoData}>Not enough data</Text>
        )}
      </View>

      <View style={[styles.insightCard, SHADOWS.card]}>
        <Text style={styles.insightTitle}>Sleep vs TEF Correlation</Text>
        {insights.sleepCorrelation !== null ? (
          <>
            <Text style={styles.insightValue}>r = {insights.sleepCorrelation.toFixed(3)}</Text>
            <Text style={styles.insightNote}>Correlation is not causation.</Text>
          </>
        ) : (
          <Text style={styles.insightNoData}>Not enough data (need 7+ days with both sleep and TEF)</Text>
        )}
      </View>

      <View style={[styles.insightCard, SHADOWS.card]}>
        <Text style={styles.insightTitle}>Steps vs TEF Correlation</Text>
        {insights.stepsCorrelation !== null ? (
          <>
            <Text style={styles.insightValue}>r = {insights.stepsCorrelation.toFixed(3)}</Text>
            <Text style={styles.insightNote}>Correlation is not causation.</Text>
          </>
        ) : (
          <Text style={styles.insightNoData}>Not enough data (need 7+ days with both steps and TEF)</Text>
        )}
      </View>

      <TouchableOpacity
        style={[styles.journalNavRow, SHADOWS.card]}
        activeOpacity={0.7}
        onPress={() => router.push({ pathname: '/stats/highlights' as any, params: { year: currentMonth.year.toString(), month: currentMonth.month.toString() } })}
      >
        <View style={styles.journalNavIcon}>
          <BookOpen size={20} color={colors.highlight} />
        </View>
        <View style={styles.journalNavContent}>
          <Text style={styles.journalNavTitle}>Monthly Highlights Journal</Text>
          <Text style={styles.journalNavSubtitle}>Tap to view this month&apos;s highlights</Text>
        </View>
        <ChevronRight size={20} color={colors.secondaryText} />
      </TouchableOpacity>

      <View style={{ height: 40 }} />

      <ChartLandscapeModal
          visible={landscapeChart !== null}
          onClose={() => setLandscapeChart(null)}
        >
          {renderLandscapeContent()}
        </ChartLandscapeModal>
      </ScrollView>
    </View>
  );
}

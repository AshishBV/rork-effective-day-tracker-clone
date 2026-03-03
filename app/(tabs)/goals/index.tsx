import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Animated,
  Alert,
  Platform,
} from 'react-native';
import { Check, RotateCcw } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useGoals, getWeekResetLabel, getMonthLabel, getYearLabel } from '@/contexts/GoalsContext';
import { SHADOWS } from '@/constants/theme';

interface GoalRowProps {
  text: string;
  completed: boolean;
  index: number;
  onChangeText: (text: string) => void;
  onToggle: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
  placeholder: string;
}

const GoalRow = React.memo(function GoalRow({
  text,
  completed,
  onChangeText,
  onToggle,
  colors,
  placeholder,
}: GoalRowProps) {
  const checkScale = useRef(new Animated.Value(completed ? 1 : 0)).current;
  const strikeWidth = useRef(new Animated.Value(completed ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(checkScale, {
        toValue: completed ? 1 : 0,
        friction: 6,
        tension: 120,
        useNativeDriver: true,
      }),
      Animated.timing(strikeWidth, {
        toValue: completed ? 1 : 0,
        duration: 250,
        useNativeDriver: false,
      }),
    ]).start();
  }, [completed, checkScale, strikeWidth]);

  const rowStyles = useMemo(() => ({
    container: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingVertical: 14,
      paddingHorizontal: 4,
    },
    checkbox: {
      width: 26,
      height: 26,
      borderRadius: 13,
      borderWidth: 1.5,
      borderColor: completed ? colors.highlight : colors.cardBorder,
      backgroundColor: completed ? colors.highlight : 'transparent',
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginRight: 14,
    },
    input: {
      flex: 1,
      fontSize: 15,
      color: completed ? colors.secondaryText : colors.primaryText,
      fontStyle: 'italic' as const,
      fontWeight: '300' as const,
      paddingVertical: Platform.OS === 'web' ? 4 : 0,
      letterSpacing: 0.2,
    },
  }), [completed, colors]);

  return (
    <View style={rowStyles.container}>
      <TouchableOpacity
        onPress={onToggle}
        style={rowStyles.checkbox}
        activeOpacity={0.7}
        testID="goal-checkbox"
      >
        <Animated.View style={{ transform: [{ scale: checkScale }], opacity: checkScale }}>
          <Check size={14} color="#FFFFFF" strokeWidth={3} />
        </Animated.View>
      </TouchableOpacity>
      <TextInput
        style={rowStyles.input}
        value={text}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.secondaryText + '60'}
        multiline={false}
        returnKeyType="done"
        testID="goal-input"
      />
    </View>
  );
});

interface ProgressArcProps {
  completed: number;
  total: number;
  size: number;
  colors: ReturnType<typeof useTheme>['colors'];
}

function ProgressArc({ completed, total, size, colors }: ProgressArcProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const ratio = total > 0 ? completed / total : 0;

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: ratio,
      friction: 8,
      tension: 40,
      useNativeDriver: false,
    }).start();
  }, [ratio, animatedValue]);

  const trackSize = size;
  const strokeWidth = 3;

  return (
    <View style={{ width: trackSize, height: trackSize, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        width: trackSize,
        height: trackSize,
        borderRadius: trackSize / 2,
        borderWidth: strokeWidth,
        borderColor: colors.divider,
        position: 'absolute',
      }} />
      <Animated.View
        style={{
          width: trackSize,
          height: trackSize,
          borderRadius: trackSize / 2,
          borderWidth: strokeWidth,
          borderColor: total > 0 ? colors.highlight : colors.divider,
          position: 'absolute',
          opacity: animatedValue.interpolate({
            inputRange: [0, 0.01, 1],
            outputRange: [0, 1, 1],
          }),
        }}
      />
      <Text style={{
        fontSize: 11,
        fontWeight: '600' as const,
        color: total > 0 ? colors.highlight : colors.secondaryText,
        letterSpacing: -0.3,
      }}>
        {completed}/{total}
      </Text>
    </View>
  );
}

interface GoalSectionProps {
  period: 'weekly' | 'monthly' | 'yearly';
  title: string;
  subtitle: string;
  resetHint: string;
}

const PLACEHOLDERS_WEEKLY = [
  'Complete project milestone...',
  'Exercise 4 times...',
  'Read 50 pages...',
  'No screen after 10 PM...',
  'Cook meals at home...',
];

const PLACEHOLDERS_MONTHLY = [
  'Finish online course...',
  'Save a fixed amount...',
  'Build a new habit...',
  'Connect with 3 friends...',
  'Declutter one room...',
];

const PLACEHOLDERS_YEARLY = [
  'Learn a new skill...',
  'Travel somewhere new...',
  'Achieve a fitness goal...',
  'Start a side project...',
  'Read 24 books...',
];

const PLACEHOLDERS: Record<string, string[]> = {
  weekly: PLACEHOLDERS_WEEKLY,
  monthly: PLACEHOLDERS_MONTHLY,
  yearly: PLACEHOLDERS_YEARLY,
};

function GoalSection({ period, title, subtitle, resetHint }: GoalSectionProps) {
  const { colors } = useTheme();
  const { goalsData, updateGoalText, toggleGoalCompleted, resetPeriod, getCompletionCount } = useGoals();

  const periodData = goalsData[period];
  const { completed, total } = getCompletionCount(period);
  const placeholders = PLACEHOLDERS[period];

  const handleReset = useCallback(() => {
    Alert.alert(
      'Reset Goals',
      `Clear all ${title.toLowerCase()} goals? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Reset', style: 'destructive', onPress: () => resetPeriod(period) },
      ]
    );
  }, [period, title, resetPeriod]);

  const styles = useMemo(() => StyleSheet.create({
    card: {
      backgroundColor: colors.cardBackground,
      borderRadius: 20,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 22,
      paddingTop: 22,
      paddingBottom: 10,
    },
    headerLeft: {
      flex: 1,
    },
    title: {
      fontSize: 13,
      fontWeight: '600' as const,
      color: colors.secondaryText,
      textTransform: 'uppercase',
      letterSpacing: 1.5,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 22,
      fontWeight: '300' as const,
      fontStyle: 'italic',
      color: colors.primaryText,
      letterSpacing: -0.3,
    },
    resetHint: {
      fontSize: 11,
      color: colors.secondaryText + 'AA',
      marginTop: 3,
      fontStyle: 'italic',
      letterSpacing: 0.2,
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    resetButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    divider: {
      height: 1,
      backgroundColor: colors.divider,
      marginHorizontal: 22,
    },
    goalsContainer: {
      paddingHorizontal: 18,
      paddingBottom: 12,
    },
    goalDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.divider,
      marginLeft: 44,
    },
  }), [colors]);

  return (
    <View style={[styles.card, SHADOWS.card]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
          <Text style={styles.resetHint}>{resetHint}</Text>
        </View>
        <View style={styles.headerRight}>
          <ProgressArc completed={completed} total={total} size={48} colors={colors} />
          <TouchableOpacity
            style={styles.resetButton}
            onPress={handleReset}
            activeOpacity={0.6}
            testID={`reset-${period}`}
          >
            <RotateCcw size={15} color={colors.secondaryText} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.divider} />
      <View style={styles.goalsContainer}>
        {periodData.goals.map((goal, idx) => (
          <React.Fragment key={idx}>
            <GoalRow
              text={goal.text}
              completed={goal.completed}
              index={idx}
              onChangeText={(text) => updateGoalText(period, idx, text)}
              onToggle={() => toggleGoalCompleted(period, idx)}
              colors={colors}
              placeholder={placeholders[idx] || `Goal ${idx + 1}...`}
            />
            {idx < periodData.goals.length - 1 && <View style={styles.goalDivider} />}
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

export default function GoalsScreen() {
  const { colors } = useTheme();
  const now = new Date();

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      paddingHorizontal: 16,
      paddingTop: 12,
      paddingBottom: 40,
    },
    pageHeader: {
      paddingHorizontal: 6,
      paddingBottom: 20,
      paddingTop: 4,
    },
    pageSubtitle: {
      fontSize: 14,
      fontStyle: 'italic',
      fontWeight: '300' as const,
      color: colors.secondaryText,
      letterSpacing: 0.3,
    },
  }), [colors]);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.pageHeader}>
          <Text style={styles.pageSubtitle}>Set intentions. Stay accountable.</Text>
        </View>

        <GoalSection
          period="weekly"
          title="This Week"
          subtitle={`Week of ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
          resetHint={getWeekResetLabel()}
        />

        <GoalSection
          period="monthly"
          title="This Month"
          subtitle={getMonthLabel(now)}
          resetHint={`Resets ${new Date(now.getFullYear(), now.getMonth() + 1, 1).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
        />

        <GoalSection
          period="yearly"
          title="This Year"
          subtitle={getYearLabel(now)}
          resetHint="Resets January 1st"
        />
      </ScrollView>
    </View>
  );
}

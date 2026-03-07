import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { SHADOWS } from '../../../constants/theme';
import { useData, useDayByDate } from '../../../contexts/DataContext';

import { getDateKey, formatDateHeader } from '../../../utils/timeUtils';
import { scheduleDailyReminderNotification } from '../../../utils/notifications';

interface LocalTextInputProps {
  initialValue: string;
  onSave: (value: string) => void;
  placeholder: string;
  placeholderTextColor: string;
  style: any;
  multiline?: boolean;
  keyboardType?: TextInput['props']['keyboardType'];
  dataKey: string;
}

function LocalTextInput({ initialValue, onSave, placeholder, placeholderTextColor, style, multiline, keyboardType }: LocalTextInputProps) {
  const [localValue, setLocalValue] = useState(initialValue);
  const isFocusedRef = useRef(false);
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;
  const localValueRef = useRef(localValue);
  localValueRef.current = localValue;

  useEffect(() => {
    if (!isFocusedRef.current) {
      setLocalValue(initialValue);
    }
  }, [initialValue]);

  const handleChangeText = useCallback((text: string) => {
    setLocalValue(text);
  }, []);

  const handleFocus = useCallback(() => {
    isFocusedRef.current = true;
  }, []);

  const handleBlur = useCallback(() => {
    isFocusedRef.current = false;
    onSaveRef.current(localValueRef.current);
  }, []);

  return (
    <TextInput
      style={style}
      value={localValue}
      onChangeText={handleChangeText}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={placeholder}
      placeholderTextColor={placeholderTextColor}
      multiline={multiline}
      keyboardType={keyboardType}
      blurOnSubmit={!multiline}
    />
  );
}

const MemoizedLocalTextInput = React.memo(LocalTextInput, (prev, next) => {
  return (
    prev.dataKey === next.dataKey &&
    prev.initialValue === next.initialValue &&
    prev.placeholder === next.placeholder &&
    prev.multiline === next.multiline &&
    prev.keyboardType === next.keyboardType
  );
});

function ReviewScreenInner() {
  const { colors } = useTheme();
  const { updateDayReview, selectedDate, setSelectedDate, getActiveHabits, getHabitCompletion, setHabitCompletion, settings } = useData();
  const [viewDate, setViewDate] = useState(selectedDate);
  const dayData = useDayByDate(viewDate);
  
  const dayDataRef = useRef(dayData);
  dayDataRef.current = dayData;
  const viewDateRef = useRef(viewDate);
  viewDateRef.current = viewDate;
  const updateDayReviewRef = useRef(updateDayReview);
  updateDayReviewRef.current = updateDayReview;

  const activeHabits = useMemo(() => getActiveHabits(), [getActiveHabits]);

  useEffect(() => {
    setViewDate(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    const pendingHabitNames = activeHabits
      .filter(h => !getHabitCompletion(viewDate, h.id))
      .map(h => h.name);
    const pendingTodos = dayData.todos
      .filter(t => t.text && !t.completed)
      .map(t => t.text);
    
    scheduleDailyReminderNotification(pendingHabitNames, pendingTodos, settings.dailyReminderEnabled ?? true);
  }, [activeHabits, viewDate, getHabitCompletion, dayData.todos, settings.dailyReminderEnabled]);

  const navigateDate = useCallback((direction: number) => {
    const date = new Date(viewDate);
    date.setDate(date.getDate() + direction);
    const newDateKey = getDateKey(date);
    setViewDate(newDateKey);
    setSelectedDate(newDateKey);
  }, [viewDate, setSelectedDate]);

  const toggleHabit = useCallback((habitId: string) => {
    const currentState = getHabitCompletion(viewDate, habitId);
    setHabitCompletion(viewDate, habitId, !currentState);
  }, [viewDate, getHabitCompletion, setHabitCompletion]);

  const saveTodo = useCallback((index: number, text: string) => {
    const newTodos = [...dayDataRef.current.todos];
    newTodos[index] = { ...newTodos[index], text };
    updateDayReviewRef.current({ todos: newTodos }, viewDateRef.current);
  }, []);

  const todoSavers = useMemo(() => {
    return dayData.todos.map((_: any, index: number) => (text: string) => saveTodo(index, text));
  }, [dayData.todos.length, saveTodo]);

  const toggleTodo = useCallback((index: number) => {
    const newTodos = [...dayDataRef.current.todos];
    newTodos[index] = { ...newTodos[index], completed: !newTodos[index].completed };
    updateDayReviewRef.current({ todos: newTodos }, viewDateRef.current);
  }, []);

  const saveGratitude = useCallback((index: number, text: string) => {
    const newGratitude = [...dayDataRef.current.gratitude];
    newGratitude[index] = text;
    updateDayReviewRef.current({ gratitude: newGratitude }, viewDateRef.current);
  }, []);

  const gratitudeSavers = useMemo(() => {
    return dayData.gratitude.map((_: any, index: number) => (text: string) => saveGratitude(index, text));
  }, [dayData.gratitude.length, saveGratitude]);

  const saveHighlight = useCallback((index: number, text: string) => {
    const newHighlights = [...dayDataRef.current.highlights];
    newHighlights[index] = text;
    updateDayReviewRef.current({ highlights: newHighlights }, viewDateRef.current);
  }, []);

  const highlightSavers = useMemo(() => {
    return dayData.highlights.map((_: any, index: number) => (text: string) => saveHighlight(index, text));
  }, [dayData.highlights.length, saveHighlight]);

  const saveSleep = useCallback((value: string) => {
    const num = parseFloat(value) || null;
    updateDayReviewRef.current({ sleepHours: num }, viewDateRef.current);
  }, []);

  const saveSteps = useCallback((value: string) => {
    const num = parseInt(value, 10) || null;
    updateDayReviewRef.current({ steps: num }, viewDateRef.current);
  }, []);

  const completedHabitsCount = useMemo(() => 
    activeHabits.filter(h => getHabitCompletion(viewDate, h.id)).length,
    [activeHabits, viewDate, getHabitCompletion]
  );
  const habitScore = activeHabits.length > 0 ? completedHabitsCount / activeHabits.length : 0;
  const displayDate = useMemo(() => new Date(viewDate + 'T12:00:00'), [viewDate]);

  const styles = useMemo(() => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  navButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.primaryText,
  },
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: 18,
    padding: 18,
    marginHorizontal: 16,
    marginBottom: 18,
  
    borderWidth: 1,
    borderColor: colors.cardBorder,
  
    elevation: 3,
  
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.primaryText,
    marginBottom: 14,
  },
  habitScore: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.highlight,
  },
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  habitEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  habitText: {
    fontSize: 14,
    color: colors.primaryText,
    flex: 1,
  },
  habitTextChecked: {
    color: colors.secondaryText,
    textDecorationLine: 'line-through' as const,
  },
  todoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },

  /* -------- FIXED INPUT COLORS -------- */

  todoInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400' as const,
    color: colors.primaryText,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },

  todoInputCompleted: {
    textDecorationLine: 'line-through' as const,
    color: colors.secondaryText,
  },

  textInput: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: colors.primaryText,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    marginBottom: 8,
    minHeight: 40,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },

  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },

  metricLabel: {
    fontSize: 14,
    color: colors.primaryText,
  },

  metricInput: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.primaryText,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.cardBackground,
    borderRadius: 12,
    minWidth: 80,
    textAlign: 'center' as const,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },

}), [colors]);

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView 
        style={styles.container} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="interactive"
      >
      <View style={styles.dateNav}>
        <TouchableOpacity style={styles.navButton} onPress={() => navigateDate(-1)}>
          <ChevronLeft size={24} color={colors.primaryText} />
        </TouchableOpacity>
        <Text style={styles.dateText}>{formatDateHeader(displayDate)}</Text>
        <TouchableOpacity style={styles.navButton} onPress={() => navigateDate(1)}>
          <ChevronRight size={24} color={colors.primaryText} />
        </TouchableOpacity>
      </View>

      <View style={[styles.card, SHADOWS.card]}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Daily Habits</Text>
          <Text style={styles.habitScore}>{Math.round(habitScore * 100)}%</Text>
        </View>
        {activeHabits.map((habit) => {
          const isCompleted = getHabitCompletion(viewDate, habit.id);
          return (
            <TouchableOpacity 
              key={habit.id} 
              style={styles.habitRow}
              onPress={() => toggleHabit(habit.id)}
            >
              <View style={[
                styles.checkbox,
                isCompleted && styles.checkboxChecked
              ]}>
                {isCompleted && <Check size={14} color="#FFFFFF" />}
              </View>
              <Text style={styles.habitEmoji}>{habit.emoji}</Text>
              <Text style={[
                styles.habitText,
                isCompleted && styles.habitTextChecked
              ]}>
                {habit.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={[styles.card, SHADOWS.card]}>
        <Text style={styles.cardTitle}>To-Do List</Text>
        {dayData.todos.map((todo, index) => (
          <View key={`todo-${viewDate}-${index}`} style={styles.todoRow}>
            <TouchableOpacity onPress={() => toggleTodo(index)}>
              <View style={[
                styles.checkbox,
                todo.completed && styles.checkboxChecked
              ]}>
                {todo.completed && <Check size={14} color="#FFFFFF" />}
              </View>
            </TouchableOpacity>
            <MemoizedLocalTextInput
              dataKey={`todo-${viewDate}-${index}`}
              initialValue={todo.text}
              onSave={todoSavers[index]}
              placeholder={`Task ${index + 1}`}
              placeholderTextColor={colors.secondaryText + '60'}
              style={[styles.todoInput, todo.completed && styles.todoInputCompleted]}
            />
          </View>
        ))}
      </View>

      <View style={[styles.card, SHADOWS.card]}>
        <Text style={styles.cardTitle}>Gratitude</Text>
        {dayData.gratitude.map((text, index) => (
          <MemoizedLocalTextInput
            key={`gratitude-${viewDate}-${index}`}
            dataKey={`gratitude-${viewDate}-${index}`}
            initialValue={text}
            onSave={gratitudeSavers[index]}
            placeholder="I'm grateful for..."
            placeholderTextColor={colors.secondaryText + '60'}
            style={styles.textInput}
            multiline
          />
        ))}
      </View>

      <View style={[styles.card, SHADOWS.card]}>
        <Text style={styles.cardTitle}>Highlights</Text>
        {dayData.highlights.map((text, index) => (
          <MemoizedLocalTextInput
            key={`highlight-${viewDate}-${index}`}
            dataKey={`highlight-${viewDate}-${index}`}
            initialValue={text}
            onSave={highlightSavers[index]}
            placeholder={`Highlight ${index + 1}`}
            placeholderTextColor={colors.secondaryText + '60'}
            style={styles.textInput}
            multiline
          />
        ))}
      </View>

      <View style={[styles.card, SHADOWS.card]}>
        <Text style={styles.cardTitle}>Health Metrics</Text>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Sleep Hours</Text>
          <MemoizedLocalTextInput
            dataKey={`sleep-${viewDate}`}
            initialValue={dayData.sleepHours?.toString() || ''}
            onSave={saveSleep}
            placeholder="0"
            placeholderTextColor={colors.secondaryText}
            style={styles.metricInput}
            keyboardType="decimal-pad"
          />
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Steps</Text>
          <MemoizedLocalTextInput
            dataKey={`steps-${viewDate}`}
            initialValue={dayData.steps?.toString() || ''}
            onSave={saveSteps}
            placeholder="0"
            placeholderTextColor={colors.secondaryText}
            style={styles.metricInput}
            keyboardType="number-pad"
          />
        </View>
      </View>

      <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default React.memo(ReviewScreenInner);

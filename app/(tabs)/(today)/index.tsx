import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity,
  RefreshControl,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Navigation, ArrowUp, ArrowDown, ZoomIn, ZoomOut } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../../contexts/ThemeContext';
import { useActivities } from '../../../contexts/ActivitiesContext';
import { SHADOWS } from '../../../constants/theme';
import { useData, useSelectedDay } from '../../../contexts/DataContext';
import { 
  getCurrentSlotIndex, 
  getPreviousSlotIndex,
  getDaySpentPercentage,
  calculateCurrentER,
  calculateMaxReachableER,
  getInitialScrollIndex,
  getHoursPerCategory,
  getUnfilledSlotsCount,
  calculateTotalSlots,
  groupSlotsByZoom,
  getZoomLabel,
  ZoomLevel,
  ZOOM_LEVELS,
  GroupedSlot,
} from '../../../utils/timeUtils';
import { TimeSlot } from '../../../types/data';

import DaySpentBar from '../../../components/DaySpentBar';
import QuickLogCard from '../../../components/QuickLogCard';
import TimeSlotRow from '../../../components/TimeSlotRow';
import SlotEditor from '../../../components/SlotEditor';
import ActivitySummaryTable from '../../../components/ActivitySummaryTable';
import MultiSelectBar from '../../../components/MultiSelectBar';
import CalendarPicker from '../../../components/CalendarPicker';

import HabitsCard from '../../../components/HabitsCard';
import Toast from '../../../components/Toast';
import DaySummaryCard from '../../../components/DaySummaryCard';
import ZoomedSlotRow from '../../../components/ZoomedSlotRow';
import BulkRangeModal from '../../../components/BulkRangeModal';

import { DEFAULT_QUOTE } from '../../../types/data';

const SLOT_HEIGHT = 52;

export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { updateSlot, updateMultipleSlots, clearSlots, settings, days, selectedDate, setSelectedDate, getActiveHabits } = useData();
  const { activities, activeActivities, getActivityByCode, getActivityLabel } = useActivities();
  const selectedDay = useSelectedDay();
  
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [sourceSlotIndex, setSourceSlotIndex] = useState<number>(0);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const timeSettings = settings.timeSettings;
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>(15);
  const [bulkRangeVisible, setBulkRangeVisible] = useState(false);
  const [bulkRangeInitialIndex, setBulkRangeInitialIndex] = useState(0);
  const [bulkRangeInitialCategory, setBulkRangeInitialCategory] = useState<string | null>(null);
  const [bulkRangeInitialDescription, setBulkRangeInitialDescription] = useState('');
  
  const listRef = useRef<FlatList>(null);
  const hasScrolled = useRef(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  const displayName = settings.displayName || 'Ashish';

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setZoomLevel(timeSettings.slotDuration as ZoomLevel);
    hasScrolled.current = false;
  }, [timeSettings.slotDuration]);

  const activeHabits = useMemo(() => getActiveHabits(), [getActiveHabits]);
  const totalSlots = useMemo(() => calculateTotalSlots(timeSettings), [timeSettings]);
  const currentSlotIndex = useMemo(() => getCurrentSlotIndex(timeSettings), [currentTime, timeSettings]);
  const previousSlotIndex = useMemo(() => getPreviousSlotIndex(timeSettings), [currentTime, timeSettings]);
  const daySpent = useMemo(() => getDaySpentPercentage(timeSettings), [currentTime, timeSettings]);
  const currentER = useMemo(() => calculateCurrentER(selectedDay.slots, activities, settings.categoryOverrides, timeSettings), [selectedDay.slots, activities, settings.categoryOverrides, timeSettings]);
  const maxReachableER = useMemo(() => calculateMaxReachableER(selectedDay.slots, activities, settings.categoryOverrides, timeSettings), [selectedDay.slots, activities, settings.categoryOverrides, timeSettings]);
  const hoursPerCategory = useMemo(() => getHoursPerCategory(selectedDay.slots), [selectedDay.slots]);
  const unfilledCount = useMemo(() => getUnfilledSlotsCount(selectedDay.slots), [selectedDay.slots]);

  const previousSlot = previousSlotIndex >= 0 ? selectedDay.slots[previousSlotIndex] : null;
  const isMultiSelectMode = selectedIndices.length > 0;

  const lastCategory = useMemo(() => {
    for (let i = selectedDay.slots.length - 1; i >= 0; i--) {
      if (selectedDay.slots[i].activityCategory) {
        return selectedDay.slots[i].activityCategory;
      }
    }
    return null;
  }, [selectedDay.slots]);

  useEffect(() => {
    if (!hasScrolled.current && listRef.current && currentSlotIndex > 0 && selectedDay.slots.length > 0) {
      const targetIndex = getInitialScrollIndex(timeSettings);
      const safeIndex = Math.min(targetIndex, selectedDay.slots.length - 1);
      if (safeIndex >= 0) {
        setTimeout(() => {
          listRef.current?.scrollToIndex({ index: safeIndex, animated: false });
          hasScrolled.current = true;
        }, 100);
      }
    }
  }, [currentSlotIndex, timeSettings, selectedDay.slots.length]);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setToastVisible(true);
  }, []);

  const handleQuickLog = useCallback((category: string) => {
    if (previousSlotIndex >= 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const slot = selectedDay.slots[previousSlotIndex];
      updateSlot(previousSlotIndex, { activityCategory: category });
      const activityLabel = getActivityLabel(category);
      showToast(`Logged ${activityLabel} for ${slot.timeIn}–${slot.timeOut}`);
    }
  }, [previousSlotIndex, updateSlot, selectedDay.slots, showToast, getActivityLabel]);

  const handleInlineQuickLog = useCallback((slotIndex: number, category: string) => {
    const slot = selectedDay.slots[slotIndex];
    if (slot) {
      updateSlot(slotIndex, { activityCategory: category });
      const activityLabel = getActivityLabel(category);
      showToast(`Logged ${activityLabel} for ${slot.timeIn}–${slot.timeOut}`);
    }
  }, [selectedDay.slots, updateSlot, showToast, getActivityLabel]);

  const handleSlotPress = useCallback((slot: TimeSlot) => {
    if (isMultiSelectMode) {
      setSelectedIndices(prev => {
        if (prev.includes(slot.index)) {
          return prev.filter(i => i !== slot.index);
        }
        return [...prev, slot.index].sort((a, b) => a - b);
      });
    } else {
      setEditingSlot(slot);
    }
  }, [isMultiSelectMode]);

  const handleSlotLongPress = useCallback((slot: TimeSlot) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setBulkRangeInitialIndex(slot.index);
    if (slot.activityCategory && slot.performedActivityText) {
      setBulkRangeInitialCategory(slot.activityCategory);
      setBulkRangeInitialDescription(slot.performedActivityText);
    } else {
      setBulkRangeInitialCategory(null);
      setBulkRangeInitialDescription('');
    }
    setBulkRangeVisible(true);
  }, []);

  const handleSaveSlot = useCallback((updates: Partial<TimeSlot>) => {
    if (editingSlot) {
      updateSlot(editingSlot.index, updates);
      if (updates.activityCategory) {
        const activityLabel = getActivityLabel(updates.activityCategory);
        showToast(`Logged ${activityLabel} for ${editingSlot.timeIn}–${editingSlot.timeOut}`);
      }
    }
  }, [editingSlot, updateSlot, showToast, getActivityLabel]);

  const handleJumpToNow = useCallback(() => {
    if (listRef.current && currentSlotIndex >= 0) {
      const safeIndex = Math.min(currentSlotIndex, selectedDay.slots.length - 1);
      listRef.current.scrollToIndex({ index: Math.max(0, safeIndex), animated: true, viewPosition: 0.4 });
    }
  }, [currentSlotIndex, selectedDay.slots.length]);

  const handleScrollToTop = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const handleScrollToBottom = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const base = zoomLevel <= timeSettings.slotDuration;
    if (base) {
      const totalItems = selectedDay.slots.length;
      if (totalItems > 0) {
        listRef.current?.scrollToIndex({ index: totalItems - 1, animated: true });
      }
    } else {
      listRef.current?.scrollToEnd({ animated: true });
    }
  }, [zoomLevel, timeSettings.slotDuration, selectedDay.slots.length]);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setShowScrollToTop(offsetY > 300);
  }, []);

  const handleEditPreviousSlot = useCallback(() => {
    if (previousSlot) {
      setEditingSlot(previousSlot);
    }
  }, [previousSlot]);

  const handleSetCategory = useCallback((category: string) => {
    updateMultipleSlots(selectedIndices, { activityCategory: category });
    const activityLabel = getActivityLabel(category);
    showToast(`Set ${activityLabel} for ${selectedIndices.length} slots`);
    setSelectedIndices([]);
  }, [selectedIndices, updateMultipleSlots, showToast, getActivityLabel]);

  const handleSetPlanned = useCallback((category: string | null) => {
    updateMultipleSlots(selectedIndices, { plannedCategory: category });
  }, [selectedIndices, updateMultipleSlots]);

  const handleApplyDescription = useCallback(() => {
    const sourceSlot = selectedDay.slots[sourceSlotIndex];
    updateMultipleSlots(selectedIndices, { performedActivityText: sourceSlot.performedActivityText });
  }, [selectedIndices, sourceSlotIndex, selectedDay.slots, updateMultipleSlots]);

  const handleApplyAll = useCallback(() => {
    const sourceSlot = selectedDay.slots[sourceSlotIndex];
    updateMultipleSlots(selectedIndices, {
      activityCategory: sourceSlot.activityCategory,
      plannedCategory: sourceSlot.plannedCategory,
      performedActivityText: sourceSlot.performedActivityText,
    });
    showToast(`Applied to ${selectedIndices.length} slots`);
    setSelectedIndices([]);
  }, [selectedIndices, sourceSlotIndex, selectedDay.slots, updateMultipleSlots, showToast]);

  const handleClear = useCallback(() => {
    clearSlots(selectedIndices);
    showToast(`Cleared ${selectedIndices.length} slots`);
    setSelectedIndices([]);
  }, [selectedIndices, clearSlots, showToast]);

  const handleCancelMultiSelect = useCallback(() => {
    setSelectedIndices([]);
  }, []);

  const handleZoomIn = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setZoomLevel(prev => {
      const idx = ZOOM_LEVELS.indexOf(prev);
      return idx > 0 ? ZOOM_LEVELS[idx - 1] : prev;
    });
  }, []);

  const handleZoomOut = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setZoomLevel(prev => {
      const idx = ZOOM_LEVELS.indexOf(prev);
      return idx < ZOOM_LEVELS.length - 1 ? ZOOM_LEVELS[idx + 1] : prev;
    });
  }, []);

  const isBaseZoom = zoomLevel === (timeSettings.slotDuration as ZoomLevel) || zoomLevel <= timeSettings.slotDuration;

  const groupedSlots = useMemo(() => {
    if (isBaseZoom) return null;
    return groupSlotsByZoom(selectedDay.slots, zoomLevel, timeSettings.slotDuration, activities);
  }, [selectedDay.slots, zoomLevel, timeSettings.slotDuration, activities, isBaseZoom]);

  const handleGroupPress = useCallback((group: GroupedSlot) => {
    if (group.slots.length === 1) {
      setEditingSlot(group.slots[0]);
    } else {
      setZoomLevel(prev => {
        const idx = ZOOM_LEVELS.indexOf(prev);
        return idx > 0 ? ZOOM_LEVELS[idx - 1] : prev;
      });
    }
  }, []);

  const handleGroupLongPress = useCallback((group: GroupedSlot) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const firstSlot = group.slots[0];
    setBulkRangeInitialIndex(firstSlot.index);
    if (firstSlot.activityCategory && firstSlot.performedActivityText) {
      setBulkRangeInitialCategory(firstSlot.activityCategory);
      setBulkRangeInitialDescription(firstSlot.performedActivityText);
    } else {
      setBulkRangeInitialCategory(null);
      setBulkRangeInitialDescription('');
    }
    setBulkRangeVisible(true);
  }, []);

  const handleFillLast30 = useCallback(() => {
    const daySpentSlots = Math.floor(daySpent * totalSlots);
    if (daySpentSlots >= 2) {
      const indices = [daySpentSlots - 2, daySpentSlots - 1];
      setSelectedIndices(indices);
      setSourceSlotIndex(indices[0]);
    }
  }, [daySpent]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setCurrentTime(new Date());
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  const renderSlot = useCallback(({ item }: { item: TimeSlot }) => {
    const isCurrentOrPrevious = item.index === currentSlotIndex || item.index === previousSlotIndex;
    return (
      <TimeSlotRow
        slot={item}
        isCurrentSlot={item.index === currentSlotIndex}
        isPreviousSlot={item.index === previousSlotIndex}
        isSelected={selectedIndices.includes(item.index)}
        showInlineButtons={isCurrentOrPrevious}
        onPress={() => handleSlotPress(item)}
        onLongPress={() => handleSlotLongPress(item)}
        onQuickLog={handleInlineQuickLog}
      />
    );
  }, [currentSlotIndex, previousSlotIndex, selectedIndices, handleSlotPress, handleSlotLongPress, handleInlineQuickLog]);

  const renderGroupedSlot = useCallback(({ item }: { item: GroupedSlot }) => (
    <ZoomedSlotRow
      group={item}
      onPress={() => handleGroupPress(item)}
      onLongPress={() => handleGroupLongPress(item)}
    />
  ), [handleGroupPress, handleGroupLongPress]);

  const bannerText = unfilledCount > 0
    ? `${displayName}, you can still reach an effective ratio of: ${maxReachableER.toFixed(2)}`
    : `${displayName}, you crushed it — ER of ${currentER.toFixed(2)}`;

  const daySpentSlots = Math.floor(daySpent * totalSlots);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    headerContainer: {
      paddingBottom: 8,
    },
    affirmation: {
      fontSize: 14,
      color: colors.secondaryText,
      textAlign: 'center',
      marginTop: 12,
      marginBottom: 8,
      marginHorizontal: 20,
      lineHeight: 22,
      fontStyle: 'italic',
      fontWeight: '500' as const,
    },
    daySpentContainer: {
      paddingHorizontal: 16,
      marginTop: 16,
    },
    bannerContainer: {
      marginHorizontal: 16,
      marginTop: 16,
      borderRadius: 14,
      overflow: 'hidden' as const,
      backgroundColor: settings.bannerColor || '#0A0A0A',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
    },
    bannerInner: {
      paddingVertical: 16,
      paddingHorizontal: 20,
    },
    bannerText: {
      fontSize: 14,
      fontWeight: '200' as const,
      fontStyle: 'italic' as const,
      color: 'rgba(255,255,255,0.75)',
      textAlign: 'center',
      lineHeight: 22,
      letterSpacing: 0.3,
      fontFamily: 'Georgia',
    },
    fillButton: {
      marginHorizontal: 16,
      marginTop: 8,
      paddingVertical: 10,
      borderRadius: 8,
      backgroundColor: colors.divider,
      alignItems: 'center',
    },
    fillButtonText: {
      fontSize: 13,
      fontWeight: '600' as const,
      color: colors.secondaryText,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.secondaryText,
      marginLeft: 16,
      marginTop: 20,
      marginBottom: 8,
    },
    footerContainer: {
      paddingTop: 16,
    },
    jumpButton: {
      position: 'absolute',
      right: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.highlight,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 24,
      ...SHADOWS.card,
    },
    jumpButtonText: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: '#FFFFFF',
    },
    scrollTopButton: {
      position: 'absolute',
      right: 16,
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.secondaryText,
      alignItems: 'center',
      justifyContent: 'center',
      ...SHADOWS.card,
    },
    scrollBottomButton: {
      position: 'absolute',
      right: 66,
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.secondaryText,
      alignItems: 'center',
      justifyContent: 'center',
      ...SHADOWS.card,
    },
    zoomRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingRight: 16,
    },
    zoomControls: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.cardBackground,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.divider,
      paddingHorizontal: 4,
      paddingVertical: 4,
    },
    zoomButton: {
      width: 32,
      height: 32,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    zoomButtonDisabled: {
      opacity: 0.4,
    },
    zoomLabelContainer: {
      paddingHorizontal: 6,
      alignItems: 'center',
    },
    zoomLabelText: {
      fontSize: 12,
      fontWeight: '700' as const,
      color: colors.secondaryText,
      fontVariant: ['tabular-nums'],
    },
  }), [colors, settings.bannerColor]);

  const ListHeader = useMemo(() => (
    <View style={styles.headerContainer}>
      <CalendarPicker 
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        days={days}
        activeHabits={activeHabits}
        hideSummary
      />

      <Text style={styles.affirmation}>{settings.quoteText || DEFAULT_QUOTE}</Text>

      <DaySummaryCard 
        selectedDate={selectedDate}
        days={days}
        activeHabits={activeHabits}
      />

      <View style={styles.daySpentContainer}>
        <DaySpentBar percentage={daySpent} />
      </View>

      <View style={styles.bannerContainer}>
        <View style={styles.bannerInner}>
          <Text style={styles.bannerText}>{bannerText}</Text>
        </View>
      </View>

      <QuickLogCard
        previousSlot={previousSlot}
        onCategorySelect={handleQuickLog}
        onEditSlot={handleEditPreviousSlot}
        onJumpToNow={handleJumpToNow}
        displayName={displayName}
      />

      <HabitsCard dateKey={selectedDate} />

      {daySpentSlots >= 2 && !isMultiSelectMode && (
        <TouchableOpacity style={styles.fillButton} onPress={handleFillLast30}>
          <Text style={styles.fillButtonText}>Fill last 30 minutes</Text>
        </TouchableOpacity>
      )}

      <View style={styles.zoomRow}>
        <Text style={styles.sectionTitle}>Time Grid</Text>
        <View style={styles.zoomControls}>
          <TouchableOpacity
            style={[
              styles.zoomButton,
              zoomLevel <= timeSettings.slotDuration && styles.zoomButtonDisabled,
            ]}
            onPress={handleZoomIn}
            disabled={zoomLevel <= timeSettings.slotDuration}
            activeOpacity={0.7}
          >
            <ZoomIn size={16} color={zoomLevel <= timeSettings.slotDuration ? colors.divider : colors.highlight} />
          </TouchableOpacity>
          <View style={styles.zoomLabelContainer}>
            <Text style={styles.zoomLabelText}>{getZoomLabel(zoomLevel)}</Text>
          </View>
          <TouchableOpacity
            style={[
              styles.zoomButton,
              zoomLevel >= 180 && styles.zoomButtonDisabled,
            ]}
            onPress={handleZoomOut}
            disabled={zoomLevel >= 180}
            activeOpacity={0.7}
          >
            <ZoomOut size={16} color={zoomLevel >= 180 ? colors.divider : colors.highlight} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  ), [selectedDate, setSelectedDate, days, daySpent, bannerText, previousSlot, handleQuickLog, handleEditPreviousSlot, handleJumpToNow, daySpentSlots, isMultiSelectMode, handleFillLast30, displayName, activeHabits, styles, zoomLevel, timeSettings.slotDuration, handleZoomIn, handleZoomOut, colors]);

  const ListFooter = useMemo(() => (
    <View style={styles.footerContainer}>
      <ActivitySummaryTable hoursPerCategory={hoursPerCategory} />
      <View style={{ height: 100 }} />
    </View>
  ), [hoursPerCategory, styles]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {isBaseZoom ? (
        <FlatList
          ref={listRef}
          data={selectedDay.slots}
          renderItem={renderSlot}
          keyExtractor={(item) => item.index.toString()}
          ListHeaderComponent={ListHeader}
          ListFooterComponent={ListFooter}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onScrollToIndexFailed={(info) => {
            setTimeout(() => {
              listRef.current?.scrollToIndex({ index: info.index, animated: false });
            }, 100);
          }}
          showsVerticalScrollIndicator={false}
          initialNumToRender={20}
          maxToRenderPerBatch={15}
          windowSize={10}
        />
      ) : (
        <FlatList
          data={groupedSlots ?? []}
          renderItem={renderGroupedSlot}
          keyExtractor={(item) => `g_${item.groupIndex}`}
          ListHeaderComponent={ListHeader}
          ListFooterComponent={ListFooter}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          onScroll={handleScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          initialNumToRender={30}
        />
      )}

      {!isMultiSelectMode && (
        <>
          {showScrollToTop && (
            <TouchableOpacity 
              style={[styles.scrollTopButton, { bottom: insets.bottom + 70 }]}
              onPress={handleScrollToTop}
            >
              <ArrowUp size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          {showScrollToTop && (
            <TouchableOpacity 
              style={[styles.scrollBottomButton, { bottom: insets.bottom + 70 }]}
              onPress={handleScrollToBottom}
            >
              <ArrowDown size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={[styles.jumpButton, { bottom: insets.bottom + 16 }]}
            onPress={handleJumpToNow}
          >
            <Navigation size={20} color="#FFFFFF" />
            <Text style={styles.jumpButtonText}>Jump to Now</Text>
          </TouchableOpacity>
        </>
      )}

      {isMultiSelectMode && (
        <MultiSelectBar
          selectedIndices={selectedIndices}
          slots={selectedDay.slots}
          sourceSlotIndex={sourceSlotIndex}
          onChangeSource={setSourceSlotIndex}
          onSetCategory={handleSetCategory}
          onSetPlanned={handleSetPlanned}
          onApplyDescription={handleApplyDescription}
          onApplyAll={handleApplyAll}
          onClear={handleClear}
          onCancel={handleCancelMultiSelect}
        />
      )}

      <SlotEditor
        visible={!!editingSlot}
        slot={editingSlot}
        lastCategory={lastCategory}
        onSave={handleSaveSlot}
        onClose={() => setEditingSlot(null)}
      />

      <BulkRangeModal
        visible={bulkRangeVisible}
        slots={selectedDay.slots}
        initialSlotIndex={bulkRangeInitialIndex}
        initialCategory={bulkRangeInitialCategory}
        initialDescription={bulkRangeInitialDescription}
        onApply={(indices, category, description) => {
          const updates: Partial<TimeSlot> = { activityCategory: category };
          if (description.trim()) {
            updates.performedActivityText = description.trim();
          }
          updateMultipleSlots(indices, updates);
          const activityLabel = getActivityLabel(category);
          showToast(`Logged ${activityLabel} for ${indices.length} slots`);
          setBulkRangeVisible(false);
        }}
        onClose={() => setBulkRangeVisible(false)}
      />

      <Toast
        visible={toastVisible}
        message={toastMessage}
        onHide={() => setToastVisible(false)}
      />
    </View>
  );
}

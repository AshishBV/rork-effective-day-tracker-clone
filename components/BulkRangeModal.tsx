import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, Clock, Check, Trash2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';
import { useActivities } from '../contexts/ActivitiesContext';
import { SHADOWS } from '../constants/theme';
import { TimeSlot } from '../types/data';
import DndTimePicker from './DndTimePicker';

type Step = 'range' | 'category' | 'description';

interface BulkRangeModalProps {
  visible: boolean;
  slots: TimeSlot[];
  initialSlotIndex: number;
  initialCategory?: string | null;
  initialDescription?: string;
  onApply: (indices: number[], category: string, description: string) => void;
  onClear?: (indices: number[]) => void;
  onClose: () => void;
}

export default function BulkRangeModal({
  visible,
  slots,
  initialSlotIndex,
  initialCategory,
  initialDescription,
  onApply,
  onClear,
  onClose,
}: BulkRangeModalProps) {
  const { colors, isDark } = useTheme();
  const { activeActivities } = useActivities();

  const [step, setStep] = useState<Step>('range');
  const [startIndex, setStartIndex] = useState(initialSlotIndex);
  const [endIndex, setEndIndex] = useState(initialSlotIndex);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);

  useEffect(() => {
    if (visible) {
      setStep('range');
      setStartIndex(initialSlotIndex);
      setEndIndex(Math.min(initialSlotIndex + 3, slots.length - 1));
      if (initialCategory && initialDescription) {
        setSelectedCategory(initialCategory);
        setDescription(initialDescription);
      } else {
        setSelectedCategory(null);
        setDescription('');
      }
    }
  }, [visible, initialSlotIndex, slots.length, initialCategory, initialDescription]);

  const selectedSlotCount = useMemo(() => {
    if (startIndex > endIndex) return 0;
    return endIndex - startIndex + 1;
  }, [startIndex, endIndex]);

  const findNearestSlotIndex = useCallback((date: Date, mode: 'start' | 'end'): number => {
    const totalMinutes = date.getHours() * 60 + date.getMinutes();
    let bestIndex = 0;
    let bestDiff = Infinity;
    for (let i = 0; i < slots.length; i++) {
      const [h, m] = (mode === 'start' ? slots[i].timeIn : slots[i].timeOut).split(':').map(Number);
      const slotMinutes = h * 60 + m;
      const diff = Math.abs(slotMinutes - totalMinutes);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestIndex = i;
      }
    }
    return bestIndex;
  }, [slots]);

  const handleFromTimeSave = useCallback((hour: number, minute: number) => {
    Haptics.selectionAsync();
    const d = new Date();
    d.setHours(hour, minute, 0, 0);
    const idx = findNearestSlotIndex(d, 'start');
    setStartIndex(Math.min(idx, endIndex));
  }, [findNearestSlotIndex, endIndex]);

  const handleToTimeSave = useCallback((hour: number, minute: number) => {
    Haptics.selectionAsync();
    const d = new Date();
    d.setHours(hour, minute, 0, 0);
    const idx = findNearestSlotIndex(d, 'end');
    setEndIndex(Math.max(idx, startIndex));
  }, [findNearestSlotIndex, startIndex]);

  const handleNextFromRange = useCallback(() => {
    if (selectedSlotCount > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setStep('category');
    }
  }, [selectedSlotCount]);

  const handleCategorySelect = useCallback((code: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(code);
    setStep('description');
  }, []);

  const handleFinish = useCallback(() => {
    if (!selectedCategory) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const indices: number[] = [];
    for (let i = startIndex; i <= endIndex; i++) {
      indices.push(i);
    }
    onApply(indices, selectedCategory, description);
  }, [startIndex, endIndex, selectedCategory, description, onApply]);

  const handleClear = useCallback(() => {
    if (!onClear) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const indices: number[] = [];
    for (let i = startIndex; i <= endIndex; i++) {
      indices.push(i);
    }
    onClear(indices);
    onClose();
  }, [startIndex, endIndex, onClear, onClose]);

  const handleBack = useCallback(() => {
    if (step === 'description') setStep('category');
    else if (step === 'category') setStep('range');
    else onClose();
  }, [step, onClose]);

  const startSlot = slots[startIndex];
  const endSlot = slots[endIndex];

  const styles = useMemo(() => StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    sheet: {
      backgroundColor: colors.cardBackground,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: '80%',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    headerLeft: {
      flex: 1,
    },
    title: {
      fontSize: 18,
      fontWeight: '700' as const,
      color: colors.primaryText,
    },
    subtitle: {
      fontSize: 13,
      color: colors.secondaryText,
      marginTop: 2,
    },
    closeBtn: {
      padding: 4,
    },
    content: {
      padding: 20,
    },
    rangeContainer: {
      gap: 20,
    },
    timePickerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
      borderRadius: 14,
      padding: 16,
    },
    timePickerLabel: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.secondaryText,
      width: 50,
    },
    timePickerCenter: {
      flex: 1,
      alignItems: 'center',
    },
    timePickerTappable: {
      paddingVertical: 8,
      paddingHorizontal: 20,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.highlight,
      borderStyle: 'dashed' as const,
    },
    timePickerTime: {
      fontSize: 28,
      fontWeight: '700' as const,
      color: colors.highlight,
      fontVariant: ['tabular-nums'],
    },
    timePickerSlotLabel: {
      fontSize: 11,
      color: colors.secondaryText,
      marginTop: 4,
    },
    tapHint: {
      fontSize: 10,
      color: colors.secondaryText,
      marginTop: 2,
      opacity: 0.7,
    },
    rangeArrow: {
      alignItems: 'center',
      paddingVertical: 4,
    },
    rangeArrowText: {
      fontSize: 13,
      color: colors.secondaryText,
      fontWeight: '500' as const,
    },
    summaryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 12,
      backgroundColor: isDark ? 'rgba(18,116,117,0.15)' : 'rgba(18,116,117,0.08)',
      borderRadius: 10,
    },
    summaryText: {
      fontSize: 15,
      fontWeight: '600' as const,
      color: colors.highlight,
    },
    categoryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    categoryButton: {
      width: '30%',
      paddingVertical: 16,
      paddingHorizontal: 8,
      borderRadius: 12,
      alignItems: 'center',
    },
    categoryCode: {
      fontSize: 20,
      fontWeight: '800' as const,
    },
    categoryName: {
      fontSize: 10,
      fontWeight: '500' as const,
      marginTop: 4,
    },
    categorySelected: {
      borderWidth: 3,
      borderColor: colors.primaryText,
    },
    descSection: {
      gap: 12,
    },
    descLabel: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.secondaryText,
    },
    descInput: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      borderRadius: 12,
      padding: 14,
      fontSize: 15,
      color: colors.primaryText,
      minHeight: 80,
      textAlignVertical: 'top' as const,
    },
    descHint: {
      fontSize: 12,
      color: colors.secondaryText,
      fontStyle: 'italic' as const,
    },
    footer: {
      flexDirection: 'row',
      padding: 20,
      paddingBottom: 36,
      gap: 12,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
    },
    backButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: colors.divider,
      alignItems: 'center',
    },
    backButtonText: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.primaryText,
    },
    clearButton: {
      flexDirection: 'row',
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 12,
      backgroundColor: colors.error + '20',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    clearButtonText: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.error,
    },
    nextButton: {
      flex: 2,
      flexDirection: 'row',
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: colors.highlight,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    nextButtonDisabled: {
      opacity: 0.5,
    },
    nextButtonText: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: '#FFFFFF',
    },
    stepIndicator: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 6,
      paddingTop: 12,
    },
    stepDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.divider,
    },
    stepDotActive: {
      backgroundColor: colors.highlight,
      width: 24,
    },
  }), [colors, isDark]);

  if (!startSlot || !endSlot) return null;

  const renderRange = () => (
    <View style={styles.rangeContainer}>
      <View style={styles.timePickerRow}>
        <Text style={styles.timePickerLabel}>From</Text>
        <View style={styles.timePickerCenter}>
          <TouchableOpacity
            style={styles.timePickerTappable}
            onPress={() => setShowFromPicker(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.timePickerTime}>{startSlot.timeIn}</Text>
          </TouchableOpacity>
          <Text style={styles.timePickerSlotLabel}>Slot #{startIndex + 1}</Text>
          <Text style={styles.tapHint}>Tap to change</Text>
        </View>
      </View>

      <View style={styles.rangeArrow}>
        <Text style={styles.rangeArrowText}>to</Text>
      </View>

      <View style={styles.timePickerRow}>
        <Text style={styles.timePickerLabel}>To</Text>
        <View style={styles.timePickerCenter}>
          <TouchableOpacity
            style={styles.timePickerTappable}
            onPress={() => setShowToPicker(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.timePickerTime}>{endSlot.timeOut}</Text>
          </TouchableOpacity>
          <Text style={styles.timePickerSlotLabel}>Slot #{endIndex + 1}</Text>
          <Text style={styles.tapHint}>Tap to change</Text>
        </View>
      </View>

      <View style={styles.summaryRow}>
        <Clock size={16} color={colors.highlight} />
        <Text style={styles.summaryText}>
          {selectedSlotCount} slots selected ({startSlot.timeIn} → {endSlot.timeOut})
        </Text>
      </View>
    </View>
  );

  const renderCategory = () => (
    <View>
      <View style={styles.categoryGrid}>
        {activeActivities.map((activity) => (
          <TouchableOpacity
            key={activity.id}
            style={[
              styles.categoryButton,
              { backgroundColor: activity.color },
              selectedCategory === activity.code && styles.categorySelected,
            ]}
            onPress={() => handleCategorySelect(activity.code)}
            activeOpacity={0.7}
          >
            <Text style={[styles.categoryCode, { color: activity.textColor }]}>
              {activity.code}
            </Text>
            <Text style={[styles.categoryName, { color: activity.textColor }]} numberOfLines={1}>
              {activity.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderDescription = () => (
    <View style={styles.descSection}>
      <Text style={styles.descLabel}>Add a description (optional)</Text>
      <TextInput
        style={styles.descInput}
        value={description}
        onChangeText={setDescription}
        placeholder="What did you do during this time?"
        placeholderTextColor={colors.secondaryText}
        multiline
        autoFocus
      />
      <Text style={styles.descHint}>
        This description will be applied to all {selectedSlotCount} selected slots.
      </Text>
    </View>
  );

  const stepTitles: Record<Step, string> = {
    range: 'Select Time Range',
    category: 'Choose Activity',
    description: 'Add Description',
  };

  const stepSubtitles: Record<Step, string> = {
    range: 'Pick start and end times for bulk logging',
    category: `Assigning to ${selectedSlotCount} slots`,
    description: `${selectedSlotCount} slots · ${selectedCategory || ''}`,
  };

  const canProceed = step === 'range' ? selectedSlotCount > 0 : step === 'category' ? !!selectedCategory : true;

  return (
    <>
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, SHADOWS.card]}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.title}>{stepTitles[step]}</Text>
              <Text style={styles.subtitle}>{stepSubtitles[step]}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={24} color={colors.secondaryText} />
            </TouchableOpacity>
          </View>

          <View style={styles.stepIndicator}>
            <View style={[styles.stepDot, step === 'range' && styles.stepDotActive]} />
            <View style={[styles.stepDot, step === 'category' && styles.stepDotActive]} />
            <View style={[styles.stepDot, step === 'description' && styles.stepDotActive]} />
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {step === 'range' && renderRange()}
            {step === 'category' && renderCategory()}
            {step === 'description' && renderDescription()}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Text style={styles.backButtonText}>
                {step === 'range' ? 'Cancel' : 'Back'}
              </Text>
            </TouchableOpacity>

            {step === 'range' && onClear && (
              <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
                <Trash2 size={16} color={colors.error} />
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
            )}

            {step === 'description' ? (
              <TouchableOpacity
                style={[styles.nextButton, !canProceed && styles.nextButtonDisabled]}
                onPress={handleFinish}
                disabled={!canProceed}
              >
                <Check size={18} color="#FFFFFF" />
                <Text style={styles.nextButtonText}>Apply to {selectedSlotCount} Slots</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.nextButton, !canProceed && styles.nextButtonDisabled]}
                onPress={step === 'range' ? handleNextFromRange : undefined}
                disabled={!canProceed}
              >
                <Text style={styles.nextButtonText}>
                  {step === 'range' ? 'Next: Choose Activity' : 'Next'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>

    <DndTimePicker
        visible={showFromPicker}
        onClose={() => setShowFromPicker(false)}
        onSave={handleFromTimeSave}
        initialHour={parseInt(startSlot.timeIn.split(':')[0], 10)}
        initialMinute={parseInt(startSlot.timeIn.split(':')[1], 10)}
        title="From Time"
        colors={colors}
      />

    <DndTimePicker
        visible={showToPicker}
        onClose={() => setShowToPicker(false)}
        onSave={handleToTimeSave}
        initialHour={parseInt(endSlot.timeOut.split(':')[0], 10)}
        initialMinute={parseInt(endSlot.timeOut.split(':')[1], 10)}
        title="To Time"
        colors={colors}
      />
    </>
  );
}

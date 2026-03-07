import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  Modal,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { X, Check, Trash2 } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';
import { useActivities } from '../contexts/ActivitiesContext';
import { SHADOWS } from '../constants/theme';
import { TimeSlot } from '../types/data';

interface SlotEditorProps {
  visible: boolean;
  slot: TimeSlot | null;
  lastCategory: string | null;
  onSave: (updates: Partial<TimeSlot>) => void;
  onClose: () => void;
}

export default function SlotEditor({ 
  visible, 
  slot, 
  lastCategory,
  onSave, 
  onClose 
}: SlotEditorProps) {
  const { colors } = useTheme();
  const { activeActivities, getActivityByCode } = useActivities();
  const [activityCategory, setActivityCategory] = useState<string | null>(null);
  const [plannedCategory, setPlannedCategory] = useState<string | null>(null);
  const [activityText, setActivityText] = useState('');
  const descriptionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const lastActivityData = lastCategory ? getActivityByCode(lastCategory) : null;

  useEffect(() => {
    if (slot) {
      setActivityCategory(slot.activityCategory);
      setPlannedCategory(slot.plannedCategory);
      setActivityText(slot.performedActivityText);
    }
  }, [slot]);

  const handleCategorySelect = useCallback((code: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActivityCategory(code);
    onSave({ activityCategory: code, plannedCategory, performedActivityText: activityText });
  }, [onSave, plannedCategory, activityText]);

  const handlePlannedSelect = useCallback((code: string | null) => {
    setPlannedCategory(code);
    onSave({ activityCategory, plannedCategory: code, performedActivityText: activityText });
  }, [onSave, activityCategory, activityText]);

  const handleDescriptionChange = useCallback((text: string) => {
    setActivityText(text);
    if (descriptionTimerRef.current) clearTimeout(descriptionTimerRef.current);
    descriptionTimerRef.current = setTimeout(() => {
      onSave({ activityCategory, plannedCategory, performedActivityText: text });
    }, 800);
  }, [onSave, activityCategory, plannedCategory]);

  useEffect(() => {
    return () => {
      if (descriptionTimerRef.current) clearTimeout(descriptionTimerRef.current);
    };
  }, []);

  const handleRepeatLast = useCallback(() => {
    if (lastCategory) {
      handleCategorySelect(lastCategory);
    }
  }, [lastCategory, handleCategorySelect]);

  const handleClear = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActivityCategory(null);
    setPlannedCategory(null);
    setActivityText('');
    onSave({ activityCategory: null, plannedCategory: null, performedActivityText: '' });
    onClose();
  }, [onSave, onClose]);

  const styles = useMemo(() => StyleSheet.create({
    overlay: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.4)',
    },
    sheet: {
      backgroundColor: colors.cardBackground,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      maxHeight: '85%',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    title: {
      fontSize: 18,
      fontWeight: '700' as const,
      color: colors.primaryText,
    },
    timeRange: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.highlight,
      marginTop: 4,
    },
    closeButton: {
      padding: 4,
    },
    content: {
      padding: 20,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.secondaryText,
      marginBottom: 12,
    },
    categoryGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    categoryButton: {
      width: '31%',
      paddingVertical: 12,
      paddingHorizontal: 8,
      borderRadius: 10,
      alignItems: 'center',
    },
    categoryButtonText: {
      fontSize: 18,
      fontWeight: '700' as const,
    },
    categoryLabel: {
      fontSize: 10,
      fontWeight: '500' as const,
      marginTop: 2,
    },
    repeatButton: {
      marginTop: 12,
      paddingVertical: 10,
      borderRadius: 8,
      backgroundColor: colors.divider,
      alignItems: 'center',
    },
    repeatButtonText: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.primaryText,
    },
    plannedRow: {
      flexDirection: 'row',
      gap: 10,
      paddingRight: 16,
    },
    plannedOption: {
      minWidth: 56,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 10,
      alignItems: 'center',
      backgroundColor: colors.divider,
    },
    plannedOptionSelected: {
      borderWidth: 2,
      borderColor: colors.primaryText,
    },
    plannedOptionText: {
      fontSize: 12,
      fontWeight: '600' as const,
      color: colors.primaryText,
    },
    textInput: {
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      borderRadius: 12,
      padding: 14,
      fontSize: 15,
      color: colors.primaryText,
      minHeight: 80,
      textAlignVertical: 'top',
    },
    footer: {
      flexDirection: 'row',
      padding: 20,
      paddingBottom: 36,
      gap: 12,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
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
    saveButton: {
      flex: 1,
      flexDirection: 'row',
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: colors.highlight,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: '#FFFFFF',
    },
  }), [colors]);

  if (!slot) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, SHADOWS.card]}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Edit Slot</Text>
              <Text style={styles.timeRange}>{slot.timeIn} → {slot.timeOut}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={colors.secondaryText} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Activity Category</Text>
              <View style={styles.categoryGrid}>
                {activeActivities.map((activity) => (
                  <Pressable
                    key={activity.id}
                    style={({ pressed }) => [
                      styles.categoryButton,
                      { 
                        backgroundColor: activity.color,
                        opacity: pressed ? 0.8 : 1,
                        borderWidth: activityCategory === activity.code ? 3 : 0,
                        borderColor: colors.primaryText,
                      }
                    ]}
                    onPress={() => handleCategorySelect(activity.code)}
                  >
                    <Text style={[styles.categoryButtonText, { color: activity.textColor }]}>
                      {activity.code}
                    </Text>
                    <Text style={[styles.categoryLabel, { color: activity.textColor }]} numberOfLines={1}>
                      {activity.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
              {lastActivityData && (
                <TouchableOpacity style={styles.repeatButton} onPress={handleRepeatLast}>
                  <Text style={styles.repeatButtonText}>Repeat last: {lastActivityData.code}</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Planned Category (Optional)</Text>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingLeft: 0 }}
              >
                <View style={styles.plannedRow}>
                  <TouchableOpacity
                    style={[
                      styles.plannedOption,
                      plannedCategory === null && styles.plannedOptionSelected
                    ]}
                    onPress={() => handlePlannedSelect(null)}
                  >
                    <Text style={styles.plannedOptionText}>None</Text>
                  </TouchableOpacity>
                  {activeActivities.map((activity) => (
                    <TouchableOpacity
                      key={activity.id}
                      style={[
                        styles.plannedOption,
                        { backgroundColor: activity.color },
                        plannedCategory === activity.code && styles.plannedOptionSelected
                      ]}
                      onPress={() => handlePlannedSelect(activity.code)}
                    >
                      <Text style={[styles.plannedOptionText, { color: activity.textColor }]}>
                        {activity.code}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Activity Description</Text>
              <TextInput
                style={styles.textInput}
                value={activityText}
                onChangeText={handleDescriptionChange}
                placeholder="What did you do?"
                placeholderTextColor={colors.secondaryText}
                multiline
              />
            </View>
          </ScrollView>

          <View style={styles.footer}>
            {activityCategory && (
              <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
                <Trash2 size={16} color={colors.error} />
                <Text style={styles.clearButtonText}>Clear</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.saveButton} onPress={onClose}>
              <Check size={18} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

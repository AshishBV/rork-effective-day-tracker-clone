import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Pressable } from 'react-native';
import { X, Copy, Trash2, Check } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useActivities } from '../contexts/ActivitiesContext';
import { TimeSlot } from '../types/data';

interface MultiSelectBarProps {
  selectedIndices: number[];
  slots: TimeSlot[];
  sourceSlotIndex: number;
  onChangeSource: (index: number) => void;
  onSetCategory: (category: string) => void;
  onSetPlanned: (category: string | null) => void;
  onApplyDescription: () => void;
  onApplyAll: () => void;
  onClear: () => void;
  onCancel: () => void;
}

export default function MultiSelectBar({
  selectedIndices,
  slots,
  sourceSlotIndex,
  onChangeSource,
  onSetCategory,
  onSetPlanned,
  onApplyDescription,
  onApplyAll,
  onClear,
  onCancel,
}: MultiSelectBarProps) {
  const { colors, isDark } = useTheme();
  const { activeActivities, getActivityByCode } = useActivities();
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showPlannedModal, setShowPlannedModal] = useState(false);
  const [showSourceModal, setShowSourceModal] = useState(false);
  const [categoryMode, setCategoryMode] = useState<'activity' | 'planned'>('activity');

  const sourceSlot = slots[sourceSlotIndex];

  const handleCategorySelect = (code: string) => {
    if (categoryMode === 'activity') {
      onSetCategory(code);
    } else {
      onSetPlanned(code);
    }
    setShowCategoryModal(false);
  };

  const styles = useMemo(() => StyleSheet.create({
    container: {
      backgroundColor: colors.cardBackground,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
      paddingTop: 12,
      paddingBottom: 24,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      marginBottom: 8,
    },
    title: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.primaryText,
    },
    closeButton: {
      padding: 4,
    },
    sourceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      marginBottom: 12,
    },
    sourceLabel: {
      fontSize: 12,
      color: colors.secondaryText,
    },
    sourceTime: {
      fontSize: 12,
      fontWeight: '600' as const,
      color: colors.highlight,
    },
    changeText: {
      fontSize: 12,
      color: colors.secondaryText,
      marginLeft: 4,
    },
    actionsScroll: {
      paddingHorizontal: 12,
    },
    actions: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 8,
      backgroundColor: colors.divider,
    },
    actionPrimary: {
      backgroundColor: colors.highlight,
    },
    actionDanger: {
      backgroundColor: isDark ? '#4A2020' : '#FFE5E5',
    },
    actionText: {
      fontSize: 13,
      fontWeight: '500' as const,
      color: colors.primaryText,
    },
    actionTextPrimary: {
      fontSize: 13,
      fontWeight: '500' as const,
      color: '#FFFFFF',
    },
    actionTextDanger: {
      fontSize: 13,
      fontWeight: '500' as const,
      color: colors.error,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContent: {
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 20,
      width: '100%',
      maxWidth: 320,
    },
    modalTitle: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.primaryText,
      marginBottom: 16,
      textAlign: 'center',
    },
    modalGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      justifyContent: 'center',
    },
    modalButton: {
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      minWidth: 60,
      alignItems: 'center',
    },
    modalButtonText: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.primaryText,
    },
    sourceList: {
      maxHeight: 300,
    },
    sourceOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 12,
      borderRadius: 8,
      marginBottom: 4,
    },
    sourceOptionSelected: {
      backgroundColor: colors.divider,
    },
    sourceOptionText: {
      fontSize: 14,
      color: colors.primaryText,
    },
    sourceCategoryPill: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
    },
  }), [colors, isDark]);

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{selectedIndices.length} slots selected</Text>
          <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
            <X size={20} color={colors.primaryText} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.sourceRow} onPress={() => setShowSourceModal(true)}>
          <Text style={styles.sourceLabel}>Source slot: </Text>
          <Text style={styles.sourceTime}>{sourceSlot.timeIn} → {sourceSlot.timeOut}</Text>
          <Text style={styles.changeText}>(Change)</Text>
        </TouchableOpacity>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.actionsScroll}>
          <View style={styles.actions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => { setCategoryMode('activity'); setShowCategoryModal(true); }}
            >
              <Text style={styles.actionText}>Set Category</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => { setCategoryMode('planned'); setShowCategoryModal(true); }}
            >
              <Text style={styles.actionText}>Set Planned</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={onApplyDescription}>
              <Copy size={16} color={colors.highlight} />
              <Text style={styles.actionText}>Apply Description</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionButton, styles.actionPrimary]} onPress={onApplyAll}>
              <Check size={16} color="#FFFFFF" />
              <Text style={styles.actionTextPrimary}>Apply All</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionButton, styles.actionDanger]} onPress={onClear}>
              <Trash2 size={16} color={colors.error} />
              <Text style={styles.actionTextDanger}>Clear</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      <Modal visible={showCategoryModal} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowCategoryModal(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {categoryMode === 'activity' ? 'Select Category' : 'Select Planned Category'}
            </Text>
            <View style={styles.modalGrid}>
              {activeActivities.map((activity) => (
                <TouchableOpacity
                  key={activity.id}
                  style={[styles.modalButton, { backgroundColor: activity.color }]}
                  onPress={() => handleCategorySelect(activity.code)}
                >
                  <Text style={[styles.modalButtonText, { color: activity.textColor }]}>
                    {activity.code}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {categoryMode === 'planned' && (
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.divider, marginTop: 8 }]}
                onPress={() => { onSetPlanned(null); setShowCategoryModal(false); }}
              >
                <Text style={styles.modalButtonText}>None</Text>
              </TouchableOpacity>
            )}
          </View>
        </Pressable>
      </Modal>

      <Modal visible={showSourceModal} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setShowSourceModal(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Source Slot</Text>
            <ScrollView style={styles.sourceList}>
              {selectedIndices.map((index) => {
                const slotActivity = slots[index].activityCategory ? getActivityByCode(slots[index].activityCategory!) : null;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.sourceOption,
                      index === sourceSlotIndex && styles.sourceOptionSelected
                    ]}
                    onPress={() => { onChangeSource(index); setShowSourceModal(false); }}
                  >
                    <Text style={styles.sourceOptionText}>
                      {slots[index].timeIn} → {slots[index].timeOut}
                    </Text>
                    {slotActivity && (
                      <View style={[
                        styles.sourceCategoryPill,
                        { backgroundColor: slotActivity.color }
                      ]}>
                        <Text style={{ color: slotActivity.textColor, fontSize: 10 }}>
                          {slotActivity.code}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

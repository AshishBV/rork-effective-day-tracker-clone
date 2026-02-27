import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
  Alert,
} from 'react-native';
import { Plus, Edit2, Trash2, ChevronUp, ChevronDown, X, Check, Smile } from 'lucide-react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { useData } from '../../../contexts/DataContext';
import { SHADOWS } from '../../../constants/theme';
import Toast from '../../../components/Toast';

const EMOJI_OPTIONS = [
  '🧘', '📚', '💪', '🚫', '📱', '🏃', '🎯', '✍️',
  '💧', '🥗', '😴', '🧹', '🎵', '🌿', '💊', '🙏',
  '🎨', '📝', '🚶', '🧠', '☀️', '🍎', '🧪', '⏰',
];

export default function HabitsScreen() {
  const { colors } = useTheme();
  const { settings, getActiveHabits, addHabit, updateHabit, deleteHabit, reorderHabits } = useData();

  const allHabits = useMemo(() => settings.customHabits || [], [settings.customHabits]);
  const activeCount = useMemo(() => getActiveHabits().length, [getActiveHabits]);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [habitName, setHabitName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('🎯');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);
  }, []);

  const resetForm = useCallback(() => {
    setHabitName('');
    setSelectedEmoji('🎯');
    setEditingId(null);
  }, []);

  const openAdd = useCallback(() => {
    resetForm();
    setModalVisible(true);
  }, [resetForm]);

  const openEdit = useCallback((habit: { id: string; name: string; emoji: string }) => {
    setEditingId(habit.id);
    setHabitName(habit.name);
    setSelectedEmoji(habit.emoji);
    setModalVisible(true);
  }, []);

  const handleSave = useCallback(() => {
    const trimmed = habitName.trim();
    if (!trimmed) {
      Alert.alert('Invalid', 'Habit name is required');
      return;
    }

    if (editingId) {
      updateHabit(editingId, { name: trimmed, emoji: selectedEmoji });
      showToast('Habit updated');
    } else {
      addHabit(trimmed, selectedEmoji);
      showToast('Habit added');
    }
    setModalVisible(false);
    resetForm();
  }, [habitName, selectedEmoji, editingId, addHabit, updateHabit, resetForm, showToast]);

  const handleDelete = useCallback((id: string, name: string) => {
    Alert.alert('Delete Habit', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteHabit(id);
          showToast('Habit deleted');
        },
      },
    ]);
  }, [deleteHabit, showToast]);

  const handleMoveUp = useCallback((index: number) => {
    if (index > 0) reorderHabits(index, index - 1);
  }, [reorderHabits]);

  const handleMoveDown = useCallback((index: number) => {
    if (index < allHabits.length - 1) reorderHabits(index, index + 1);
  }, [reorderHabits, allHabits.length]);

  const handleToggleActive = useCallback((id: string, currentActive: boolean) => {
    updateHabit(id, { active: !currentActive });
  }, [updateHabit]);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 16,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    headerText: {
      fontSize: 14,
      color: colors.secondaryText,
    },
    addButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.highlight,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 10,
    },
    addButtonText: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: '#FFFFFF',
    },
    habitCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      flexDirection: 'row',
      alignItems: 'center',
    },
    habitCardInactive: {
      opacity: 0.5,
    },
    reorderButtons: {
      flexDirection: 'column',
      marginRight: 8,
    },
    reorderButton: {
      padding: 4,
    },
    emojiContainer: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    emoji: {
      fontSize: 20,
    },
    habitInfo: {
      flex: 1,
    },
    habitName: {
      fontSize: 15,
      fontWeight: '600' as const,
      color: colors.primaryText,
    },
    habitStatus: {
      fontSize: 12,
      color: colors.secondaryText,
      marginTop: 2,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    actionButton: {
      padding: 8,
    },
    toggleButton: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      marginRight: 4,
    },
    toggleButtonActive: {
      backgroundColor: `${colors.success}20`,
    },
    toggleButtonInactive: {
      backgroundColor: `${colors.error}15`,
    },
    toggleText: {
      fontSize: 11,
      fontWeight: '600' as const,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContent: {
      backgroundColor: colors.cardBackground,
      borderRadius: 20,
      padding: 24,
      width: '100%',
      maxWidth: 400,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700' as const,
      color: colors.primaryText,
    },
    closeButton: {
      padding: 4,
    },
    inputLabel: {
      fontSize: 13,
      fontWeight: '600' as const,
      color: colors.secondaryText,
      marginBottom: 6,
      marginTop: 12,
    },
    input: {
      fontSize: 16,
      color: colors.primaryText,
      paddingVertical: 12,
      paddingHorizontal: 14,
      backgroundColor: colors.background,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    emojiGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginTop: 4,
    },
    emojiOption: {
      width: 40,
      height: 40,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
    },
    emojiOptionSelected: {
      borderWidth: 3,
      borderColor: colors.highlight,
      backgroundColor: `${colors.highlight}15`,
    },
    emojiOptionText: {
      fontSize: 20,
    },
    modalFooter: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 24,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: colors.divider,
      alignItems: 'center',
    },
    cancelButtonText: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.primaryText,
    },
    saveButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: colors.highlight,
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: '#FFFFFF',
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyText: {
      fontSize: 16,
      color: colors.secondaryText,
      marginTop: 12,
    },
    emptyHint: {
      fontSize: 13,
      color: colors.secondaryText,
      marginTop: 4,
    },
  }), [colors]);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerText}>{activeCount} active habits</Text>
          <TouchableOpacity style={styles.addButton} onPress={openAdd}>
            <Plus size={18} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>

        {allHabits.length === 0 && (
          <View style={styles.emptyState}>
            <Smile size={40} color={colors.secondaryText} />
            <Text style={styles.emptyText}>No habits yet</Text>
            <Text style={styles.emptyHint}>Tap "Add" to create your first habit</Text>
          </View>
        )}

        {allHabits.map((habit, index) => (
          <View
            key={habit.id}
            style={[styles.habitCard, !habit.active && styles.habitCardInactive, SHADOWS.card]}
          >
            <View style={styles.reorderButtons}>
              <TouchableOpacity
                style={styles.reorderButton}
                onPress={() => handleMoveUp(index)}
                disabled={index === 0}
              >
                <ChevronUp size={18} color={index === 0 ? colors.divider : colors.secondaryText} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.reorderButton}
                onPress={() => handleMoveDown(index)}
                disabled={index === allHabits.length - 1}
              >
                <ChevronDown size={18} color={index === allHabits.length - 1 ? colors.divider : colors.secondaryText} />
              </TouchableOpacity>
            </View>

            <View style={styles.emojiContainer}>
              <Text style={styles.emoji}>{habit.emoji}</Text>
            </View>

            <View style={styles.habitInfo}>
              <Text style={styles.habitName}>{habit.name}</Text>
              <Text style={styles.habitStatus}>{habit.active ? 'Active' : 'Inactive'}</Text>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  habit.active ? styles.toggleButtonActive : styles.toggleButtonInactive,
                ]}
                onPress={() => handleToggleActive(habit.id, habit.active)}
              >
                <Text style={[styles.toggleText, { color: habit.active ? colors.success : colors.error }]}>
                  {habit.active ? 'ON' : 'OFF'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={() => openEdit(habit)}>
                <Edit2 size={18} color={colors.secondaryText} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={() => handleDelete(habit.id, habit.name)}>
                <Trash2 size={18} color={colors.error} />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingId ? 'Edit Habit' : 'Add Habit'}
              </Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                <X size={24} color={colors.secondaryText} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Habit Name</Text>
            <TextInput
              style={styles.input}
              value={habitName}
              onChangeText={setHabitName}
              placeholder="e.g., 30 minutes exercise"
              placeholderTextColor={colors.secondaryText}
            />

            <Text style={styles.inputLabel}>Emoji</Text>
            <View style={styles.emojiGrid}>
              {EMOJI_OPTIONS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={[
                    styles.emojiOption,
                    selectedEmoji === emoji && styles.emojiOptionSelected,
                  ]}
                  onPress={() => setSelectedEmoji(emoji)}
                >
                  <Text style={styles.emojiOptionText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Check size={18} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      <Toast
        visible={toastVisible}
        message={toastMessage}
        onHide={() => setToastVisible(false)}
      />
    </View>
  );
}

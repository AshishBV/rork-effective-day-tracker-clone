import React, { useState, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Modal, 
  TextInput, 
  TouchableOpacity,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';
import { X, Plus, Trash2, Edit2, ChevronUp, ChevronDown, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';
import { SHADOWS } from '../constants/theme';
import { Habit } from '../types/data';

const EMOJI_OPTIONS = ['🧘', '📚', '💪', '🚫', '📱', '🏃', '💧', '🥗', '😴', '🎯', '✍️', '🧠', '🎨', '🎵', '🌅', '🙏'];

interface HabitEditorProps {
  habits: Habit[];
  onAdd: (name: string, emoji: string) => void;
  onUpdate: (habitId: string, updates: Partial<Habit>) => void;
  onDelete: (habitId: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
}

interface EditModalProps {
  visible: boolean;
  habit: Habit | null;
  isNew: boolean;
  onSave: (name: string, emoji: string) => void;
  onClose: () => void;
}

function EditModal({ visible, habit, isNew, onSave, onClose }: EditModalProps) {
  const { colors } = useTheme();
  const [name, setName] = useState(habit?.name || '');
  const [emoji, setEmoji] = useState(habit?.emoji || '🎯');

  React.useEffect(() => {
    if (visible) {
      setName(habit?.name || '');
      setEmoji(habit?.emoji || '🎯');
    }
  }, [visible, habit]);

  const handleSave = () => {
    if (name.trim()) {
      onSave(name.trim(), emoji);
      onClose();
    }
  };

  const modalStyles = useMemo(() => StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    backdrop: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    container: {
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 20,
      width: '100%',
      maxWidth: 340,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    title: {
      fontSize: 18,
      fontWeight: '600' as const,
      color: colors.primaryText,
    },
    closeBtn: {
      padding: 4,
    },
    label: {
      fontSize: 13,
      fontWeight: '500' as const,
      color: colors.secondaryText,
      marginBottom: 8,
    },
    input: {
      backgroundColor: colors.background,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.primaryText,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.divider,
    },
    emojiScroll: {
      marginBottom: 20,
    },
    emojiRow: {
      flexDirection: 'row',
      gap: 8,
    },
    emojiBtn: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    emojiBtnSelected: {
      borderColor: colors.highlight,
      backgroundColor: `${colors.highlight}15`,
    },
    emojiText: {
      fontSize: 20,
    },
    saveBtn: {
      backgroundColor: colors.highlight,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
    },
    saveBtnDisabled: {
      opacity: 0.5,
    },
    saveBtnText: {
      fontSize: 15,
      fontWeight: '600' as const,
      color: '#FFFFFF',
    },
  }), [colors]);

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <Pressable style={modalStyles.backdrop} onPress={onClose} />
        <View style={[modalStyles.container, SHADOWS.card]}>
          <View style={modalStyles.header}>
            <Text style={modalStyles.title}>{isNew ? 'Add Habit' : 'Edit Habit'}</Text>
            <TouchableOpacity onPress={onClose} style={modalStyles.closeBtn}>
              <X size={20} color={colors.secondaryText} />
            </TouchableOpacity>
          </View>

          <Text style={modalStyles.label}>Name</Text>
          <TextInput
            style={modalStyles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter habit name"
            placeholderTextColor={colors.secondaryText}
            autoFocus
          />

          <Text style={modalStyles.label}>Icon</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={modalStyles.emojiScroll}>
            <View style={modalStyles.emojiRow}>
              {EMOJI_OPTIONS.map((e) => (
                <TouchableOpacity
                  key={e}
                  style={[modalStyles.emojiBtn, emoji === e && modalStyles.emojiBtnSelected]}
                  onPress={() => setEmoji(e)}
                >
                  <Text style={modalStyles.emojiText}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <TouchableOpacity
            style={[modalStyles.saveBtn, !name.trim() && modalStyles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!name.trim()}
          >
            <Text style={modalStyles.saveBtnText}>{isNew ? 'Add Habit' : 'Save Changes'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function HabitEditor({ habits, onAdd, onUpdate, onDelete, onReorder }: HabitEditorProps) {
  const { colors } = useTheme();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [isNewHabit, setIsNewHabit] = useState(false);

  const handleAddNew = useCallback(() => {
    setEditingHabit(null);
    setIsNewHabit(true);
    setEditModalVisible(true);
  }, []);

  const handleEdit = useCallback((habit: Habit) => {
    setEditingHabit(habit);
    setIsNewHabit(false);
    setEditModalVisible(true);
  }, []);

  const handleSave = useCallback((name: string, emoji: string) => {
    if (isNewHabit) {
      onAdd(name, emoji);
    } else if (editingHabit) {
      onUpdate(editingHabit.id, { name, emoji });
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [isNewHabit, editingHabit, onAdd, onUpdate]);

  const handleDelete = useCallback((habit: Habit) => {
    Alert.alert(
      'Delete Habit',
      `Are you sure you want to delete "${habit.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            onDelete(habit.id);
          }
        },
      ]
    );
  }, [onDelete]);

  const handleToggleActive = useCallback((habit: Habit) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onUpdate(habit.id, { active: !habit.active });
  }, [onUpdate]);

  const handleMoveUp = useCallback((index: number) => {
    if (index > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onReorder(index, index - 1);
    }
  }, [onReorder]);

  const handleMoveDown = useCallback((index: number) => {
    if (index < habits.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onReorder(index, index + 1);
    }
  }, [onReorder, habits.length]);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      marginTop: 8,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    title: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.primaryText,
    },
    addBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.highlight,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
    },
    addBtnText: {
      fontSize: 13,
      fontWeight: '600' as const,
      color: '#FFFFFF',
    },
    emptyText: {
      fontSize: 13,
      color: colors.secondaryText,
      textAlign: 'center',
      paddingVertical: 20,
    },
    habitRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
      gap: 10,
    },
    activeToggle: {
      width: 22,
      height: 22,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: colors.cardBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },
    activeToggleOn: {
      backgroundColor: colors.success,
      borderColor: colors.success,
    },
    habitEmoji: {
      fontSize: 18,
    },
    habitName: {
      flex: 1,
      fontSize: 14,
      color: colors.primaryText,
    },
    habitNameInactive: {
      color: colors.secondaryText,
      textDecorationLine: 'line-through',
    },
    actions: {
      flexDirection: 'row',
      gap: 4,
    },
    actionBtn: {
      padding: 6,
      borderRadius: 6,
      backgroundColor: colors.background,
    },
  }), [colors]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Manage Habits</Text>
        <TouchableOpacity style={styles.addBtn} onPress={handleAddNew}>
          <Plus size={18} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {habits.length === 0 ? (
        <Text style={styles.emptyText}>No habits configured. Add your first habit!</Text>
      ) : (
        habits.map((habit, index) => (
          <View key={habit.id} style={styles.habitRow}>
            <TouchableOpacity 
              style={[styles.activeToggle, habit.active && styles.activeToggleOn]}
              onPress={() => handleToggleActive(habit)}
            >
              {habit.active && <Check size={12} color="#FFFFFF" />}
            </TouchableOpacity>
            
            <Text style={styles.habitEmoji}>{habit.emoji}</Text>
            <Text style={[styles.habitName, !habit.active && styles.habitNameInactive]} numberOfLines={1}>
              {habit.name}
            </Text>

            <View style={styles.actions}>
              <TouchableOpacity 
                style={styles.actionBtn} 
                onPress={() => handleMoveUp(index)}
                disabled={index === 0}
              >
                <ChevronUp size={18} color={index === 0 ? colors.divider : colors.secondaryText} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.actionBtn} 
                onPress={() => handleMoveDown(index)}
                disabled={index === habits.length - 1}
              >
                <ChevronDown size={18} color={index === habits.length - 1 ? colors.divider : colors.secondaryText} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => handleEdit(habit)}>
                <Edit2 size={16} color={colors.highlight} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(habit)}>
                <Trash2 size={16} color={colors.error} />
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}

      <EditModal
        visible={editModalVisible}
        habit={editingHabit}
        isNew={isNewHabit}
        onSave={handleSave}
        onClose={() => setEditModalVisible(false)}
      />
    </View>
  );
}

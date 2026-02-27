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
  Switch,
} from 'react-native';
import { Plus, Edit2, Trash2, ChevronUp, ChevronDown, X, Check } from 'lucide-react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { useActivities } from '../../../contexts/ActivitiesContext';
import { SHADOWS } from '../../../constants/theme';
import { Activity, ER_POINTS_MAP } from '../../../types/data';
import Toast from '../../../components/Toast';

const COLOR_OPTIONS = [
  '#104911', '#127475', '#FFE5A0', '#E6E6E6', '#720026', 
  '#4A90A4', '#8B0000', '#2E7D32', '#1565C0', '#7B1FA2',
  '#F57C00', '#455A64', '#D32F2F', '#00838F', '#6A1B9A',
];

export default function ActivitiesScreen() {
  const { colors, isDark } = useTheme();
  const { 
    sortedActivities, 
    activeActivities,
    addActivity, 
    updateActivity, 
    deleteActivity, 
    toggleActive,
    moveUp,
    moveDown,
    isCodeUnique,
  } = useActivities();
  
  const [modalVisible, setModalVisible] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setToastVisible(true);
  }, []);

  const resetForm = useCallback(() => {
    setCode('');
    setName('');
    setSelectedColor(COLOR_OPTIONS[0]);
    setEditingActivity(null);
  }, []);

  const openAddModal = useCallback(() => {
    resetForm();
    setModalVisible(true);
  }, [resetForm]);

  const openEditModal = useCallback((activity: Activity) => {
    setEditingActivity(activity);
    setCode(activity.code);
    setName(activity.name);
    setSelectedColor(activity.color);
    setModalVisible(true);
  }, []);

  const getErPointsForCode = (activityCode: string): number => {
    const upperCode = activityCode.toUpperCase();
    if (upperCode in ER_POINTS_MAP) {
      return ER_POINTS_MAP[upperCode];
    }
    return upperCode === 'CA' ? 0.5 : 1;
  };

  const handleSave = useCallback(() => {
    const trimmedCode = code.trim().toUpperCase();
    const trimmedName = name.trim();

    if (!trimmedCode || trimmedCode.length > 3) {
      Alert.alert('Invalid Code', 'Code must be 1-3 characters');
      return;
    }
    if (!trimmedName) {
      Alert.alert('Invalid Name', 'Name is required');
      return;
    }
    if (!isCodeUnique(trimmedCode, editingActivity?.id)) {
      Alert.alert('Duplicate Code', 'This code is already used by another activity');
      return;
    }

    const textColor = isDark || ['#104911', '#127475', '#720026', '#4A90A4', '#8B0000', '#2E7D32', '#1565C0', '#7B1FA2', '#D32F2F', '#00838F', '#6A1B9A'].includes(selectedColor) ? '#FFFFFF' : '#111111';

    if (editingActivity) {
      updateActivity(editingActivity.id, {
        code: trimmedCode,
        name: trimmedName,
        color: selectedColor,
        textColor,
      });
      showToast('Activity updated');
    } else {
      addActivity({
        code: trimmedCode,
        name: trimmedName,
        color: selectedColor,
        textColor,
      });
      showToast('Activity added');
    }

    setModalVisible(false);
    resetForm();
  }, [code, name, selectedColor, editingActivity, isCodeUnique, addActivity, updateActivity, resetForm, showToast, isDark]);

  const handleDelete = useCallback((activity: Activity) => {
    Alert.alert(
      'Delete Activity',
      `Are you sure you want to delete "${activity.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const result = deleteActivity(activity.id);
            if (!result.success) {
              Alert.alert('Cannot Delete', result.error);
            } else {
              showToast('Activity deleted');
            }
          },
        },
      ]
    );
  }, [deleteActivity, showToast]);

  const handleToggleActive = useCallback((activity: Activity) => {
    const result = toggleActive(activity.id);
    if (!result.success) {
      Alert.alert('Cannot Disable', result.error);
    }
  }, [toggleActive]);

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
    activityCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: 12,
      padding: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      flexDirection: 'row',
      alignItems: 'center',
    },
    colorBadge: {
      width: 40,
      height: 40,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    codeText: {
      fontSize: 14,
      fontWeight: '700' as const,
    },
    activityInfo: {
      flex: 1,
    },
    activityName: {
      fontSize: 15,
      fontWeight: '600' as const,
      color: colors.primaryText,
    },
    activityPoints: {
      fontSize: 13,
      color: colors.secondaryText,
      marginTop: 2,
    },
    activityActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    actionButton: {
      padding: 8,
    },
    reorderButtons: {
      flexDirection: 'column',
      marginRight: 4,
    },
    reorderButton: {
      padding: 4,
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
    codeInput: {
      textTransform: 'uppercase' as const,
    },
    colorGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginTop: 4,
    },
    colorOption: {
      width: 36,
      height: 36,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    colorOptionSelected: {
      borderWidth: 3,
      borderColor: colors.primaryText,
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
    inactiveCard: {
      opacity: 0.6,
    },
    erPointsDisplay: {
      backgroundColor: colors.background,
      borderRadius: 10,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    erPointsValue: {
      fontSize: 18,
      fontWeight: '700' as const,
      color: colors.highlight,
      marginBottom: 4,
    },
    erPointsHint: {
      fontSize: 12,
      color: colors.secondaryText,
    },
  }), [colors]);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerText}>{activeActivities.length} active activities</Text>
          <TouchableOpacity style={styles.addButton} onPress={openAddModal}>
            <Plus size={18} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>

        {sortedActivities.map((activity, index) => (
          <View 
            key={activity.id} 
            style={[styles.activityCard, !activity.isActive && styles.inactiveCard, SHADOWS.card]}
          >
            <View style={styles.reorderButtons}>
              <TouchableOpacity 
                style={styles.reorderButton} 
                onPress={() => moveUp(activity.id)}
                disabled={index === 0}
              >
                <ChevronUp size={18} color={index === 0 ? colors.divider : colors.secondaryText} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.reorderButton} 
                onPress={() => moveDown(activity.id)}
                disabled={index === sortedActivities.length - 1}
              >
                <ChevronDown size={18} color={index === sortedActivities.length - 1 ? colors.divider : colors.secondaryText} />
              </TouchableOpacity>
            </View>

            <View style={[styles.colorBadge, { backgroundColor: activity.color }]}>
              <Text style={[styles.codeText, { color: activity.textColor }]}>{activity.code}</Text>
            </View>

            <View style={styles.activityInfo}>
              <Text style={styles.activityName}>{activity.name}</Text>
              <Text style={styles.activityPoints}>
                ER: {activity.erPoints ?? getErPointsForCode(activity.code)}
              </Text>
            </View>

            <View style={styles.activityActions}>
              <Switch
                value={activity.isActive}
                onValueChange={() => handleToggleActive(activity)}
                trackColor={{ false: colors.divider, true: colors.highlight }}
                thumbColor="#FFFFFF"
              />
              <TouchableOpacity style={styles.actionButton} onPress={() => openEditModal(activity)}>
                <Edit2 size={18} color={colors.secondaryText} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={() => handleDelete(activity)}>
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
                {editingActivity ? 'Edit Activity' : 'Add Activity'}
              </Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
                <X size={24} color={colors.secondaryText} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Code (1-3 characters)</Text>
            <TextInput
              style={[styles.input, styles.codeInput]}
              value={code}
              onChangeText={(t) => setCode(t.toUpperCase().slice(0, 3))}
              placeholder="e.g., P, A, EC"
              placeholderTextColor={colors.secondaryText}
              maxLength={3}
              autoCapitalize="characters"
            />

            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Personal, Academics"
              placeholderTextColor={colors.secondaryText}
            />

            <Text style={styles.inputLabel}>ER Points (auto-assigned by code)</Text>
            <View style={styles.erPointsDisplay}>
              <Text style={styles.erPointsValue}>
                {code ? getErPointsForCode(code) : '—'}
              </Text>
              <Text style={styles.erPointsHint}>
                P/A/EC = 1, CA = 0.5, I/S/TW = 0
              </Text>
            </View>

            <Text style={styles.inputLabel}>Color</Text>
            <View style={styles.colorGrid}>
              {COLOR_OPTIONS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && styles.colorOptionSelected,
                  ]}
                  onPress={() => setSelectedColor(color)}
                >
                  {selectedColor === color && <Check size={18} color="#FFFFFF" />}
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

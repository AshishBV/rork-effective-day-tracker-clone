import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
  Animated,
} from 'react-native';
import { ChevronUp, ChevronDown } from 'lucide-react-native';

const MINUTES = [0, 15, 30, 45];

interface DndTimePickerProps {
  visible: boolean;
  onClose: () => void;
  onSave: (hour: number, minute: number) => void;
  initialHour: number;
  initialMinute: number;
  title: string;
  colors: {
    cardBackground: string;
    primaryText: string;
    secondaryText: string;
    highlight: string;
    background: string;
  };
}

export default function DndTimePicker({
  visible,
  onClose,
  onSave,
  initialHour,
  initialMinute,
  title,
  colors,
}: DndTimePickerProps) {
  const [hour, setHour] = useState(initialHour);
  const [minute, setMinute] = useState(initialMinute);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setHour(initialHour);
      setMinute(initialMinute);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [visible, initialHour, initialMinute, fadeAnim]);

  const incrementHour = useCallback(() => setHour(h => (h + 1) % 24), []);
  const decrementHour = useCallback(() => setHour(h => (h - 1 + 24) % 24), []);
  const incrementMinute = useCallback(() => {
    setMinute(m => {
      const idx = MINUTES.indexOf(m);
      return MINUTES[(idx + 1) % MINUTES.length];
    });
  }, []);
  const decrementMinute = useCallback(() => {
    setMinute(m => {
      const idx = MINUTES.indexOf(m);
      return MINUTES[(idx - 1 + MINUTES.length) % MINUTES.length];
    });
  }, []);

  const modalStyles = useMemo(() => StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    container: {
      backgroundColor: colors.cardBackground,
      borderRadius: 20,
      padding: 24,
      width: 280,
      alignItems: 'center',
    },
    title: {
      fontSize: 17,
      fontWeight: '600' as const,
      color: colors.primaryText,
      marginBottom: 24,
    },
    pickerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    pickerColumn: {
      alignItems: 'center',
      gap: 6,
    },
    arrowButton: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    valueBox: {
      width: 64,
      height: 56,
      borderRadius: 14,
      backgroundColor: colors.highlight + '18',
      borderWidth: 2,
      borderColor: colors.highlight,
      justifyContent: 'center',
      alignItems: 'center',
    },
    valueText: {
      fontSize: 28,
      fontWeight: '700' as const,
      color: colors.primaryText,
    },
    separator: {
      fontSize: 28,
      fontWeight: '700' as const,
      color: colors.secondaryText,
      marginHorizontal: 4,
    },
    pickerLabel: {
      fontSize: 11,
      color: colors.secondaryText,
      marginTop: 4,
      fontWeight: '500' as const,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 28,
      width: '100%',
    },
    cancelButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: colors.background,
      alignItems: 'center',
    },
    cancelText: {
      fontSize: 15,
      fontWeight: '600' as const,
      color: colors.secondaryText,
    },
    saveButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: colors.highlight,
      alignItems: 'center',
    },
    saveText: {
      fontSize: 15,
      fontWeight: '600' as const,
      color: '#FFFFFF',
    },
  }), [colors]);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable style={modalStyles.overlay} onPress={onClose}>
        <Animated.View style={[modalStyles.container, { opacity: fadeAnim }]}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <Text style={modalStyles.title}>{title}</Text>
            <View style={modalStyles.pickerRow}>
              <View style={modalStyles.pickerColumn}>
                <TouchableOpacity style={modalStyles.arrowButton} onPress={incrementHour}>
                  <ChevronUp size={22} color={colors.primaryText} />
                </TouchableOpacity>
                <View style={modalStyles.valueBox}>
                  <Text style={modalStyles.valueText}>{String(hour).padStart(2, '0')}</Text>
                </View>
                <TouchableOpacity style={modalStyles.arrowButton} onPress={decrementHour}>
                  <ChevronDown size={22} color={colors.primaryText} />
                </TouchableOpacity>
                <Text style={modalStyles.pickerLabel}>HOUR</Text>
              </View>

              <Text style={modalStyles.separator}>:</Text>

              <View style={modalStyles.pickerColumn}>
                <TouchableOpacity style={modalStyles.arrowButton} onPress={incrementMinute}>
                  <ChevronUp size={22} color={colors.primaryText} />
                </TouchableOpacity>
                <View style={modalStyles.valueBox}>
                  <Text style={modalStyles.valueText}>{String(minute).padStart(2, '0')}</Text>
                </View>
                <TouchableOpacity style={modalStyles.arrowButton} onPress={decrementMinute}>
                  <ChevronDown size={22} color={colors.primaryText} />
                </TouchableOpacity>
                <Text style={modalStyles.pickerLabel}>MIN</Text>
              </View>
            </View>

            <View style={modalStyles.buttonRow}>
              <TouchableOpacity style={modalStyles.cancelButton} onPress={onClose}>
                <Text style={modalStyles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={modalStyles.saveButton} onPress={() => { onSave(hour, minute); onClose(); }}>
                <Text style={modalStyles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

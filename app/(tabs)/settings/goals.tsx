import React, { useState, useMemo, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Target, Check, TrendingUp, Moon, Footprints } from 'lucide-react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { useData } from '../../../contexts/DataContext';
import { SHADOWS } from '../../../constants/theme';
import Toast from '../../../components/Toast';

export default function GoalsScreen() {
  const { colors } = useTheme();
  const { settings, updateSettings } = useData();
  
  const [erGoal, setErGoal] = useState(settings.erGoal?.toString() || '80');
  const [sleepGoal, setSleepGoal] = useState(settings.sleepGoal?.toString() || '6');
  const [stepsGoal, setStepsGoal] = useState(settings.stepsGoal?.toString() || '6000');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setToastVisible(true);
  }, []);

  const handleSave = useCallback(() => {
    const erNum = parseFloat(erGoal);
    const sleepNum = parseFloat(sleepGoal);
    const stepsNum = parseInt(stepsGoal, 10);

    if (isNaN(erNum) || erNum < 0 || erNum > 100) {
      showToast('ER Goal must be between 0 and 100');
      return;
    }
    if (isNaN(sleepNum) || sleepNum < 0 || sleepNum > 24) {
      showToast('Sleep Goal must be between 0 and 24 hours');
      return;
    }
    if (isNaN(stepsNum) || stepsNum < 0) {
      showToast('Steps Goal must be a positive number');
      return;
    }

    updateSettings({
      erGoal: erNum,
      sleepGoal: sleepNum,
      stepsGoal: stepsNum,
    });
    showToast('Goals saved');
  }, [erGoal, sleepGoal, stepsGoal, updateSettings, showToast]);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 16,
    },
    section: {
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    goalRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    goalRowLast: {
      borderBottomWidth: 0,
    },
    goalIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
    },
    goalInfo: {
      flex: 1,
    },
    goalLabel: {
      fontSize: 15,
      fontWeight: '600' as const,
      color: colors.primaryText,
    },
    goalDescription: {
      fontSize: 13,
      color: colors.secondaryText,
      marginTop: 2,
    },
    goalInputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    goalInput: {
      fontSize: 18,
      fontWeight: '700' as const,
      color: colors.highlight,
      textAlign: 'right',
      minWidth: 60,
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: colors.background,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    goalUnit: {
      fontSize: 14,
      color: colors.secondaryText,
      fontWeight: '500' as const,
    },
    saveButton: {
      backgroundColor: colors.highlight,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 8,
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: '#FFFFFF',
    },
    note: {
      fontSize: 13,
      color: colors.secondaryText,
      textAlign: 'center',
      marginTop: 16,
      lineHeight: 20,
    },
  }), [colors]);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.section, SHADOWS.card]}>
          <View style={styles.goalRow}>
            <View style={[styles.goalIcon, { backgroundColor: colors.highlight + '20' }]}>
              <TrendingUp size={22} color={colors.highlight} />
            </View>
            <View style={styles.goalInfo}>
              <Text style={styles.goalLabel}>Effective Ratio Goal</Text>
              <Text style={styles.goalDescription}>Target completion percentage</Text>
            </View>
            <View style={styles.goalInputContainer}>
              <TextInput
                style={styles.goalInput}
                value={erGoal}
                onChangeText={setErGoal}
                keyboardType="numeric"
                maxLength={3}
              />
              <Text style={styles.goalUnit}>%</Text>
            </View>
          </View>

          <View style={styles.goalRow}>
            <View style={[styles.goalIcon, { backgroundColor: '#6B5BFF20' }]}>
              <Moon size={22} color="#6B5BFF" />
            </View>
            <View style={styles.goalInfo}>
              <Text style={styles.goalLabel}>Sleep Goal</Text>
              <Text style={styles.goalDescription}>Target sleep hours per night</Text>
            </View>
            <View style={styles.goalInputContainer}>
              <TextInput
                style={styles.goalInput}
                value={sleepGoal}
                onChangeText={setSleepGoal}
                keyboardType="numeric"
                maxLength={2}
              />
              <Text style={styles.goalUnit}>hrs</Text>
            </View>
          </View>

          <View style={[styles.goalRow, styles.goalRowLast]}>
            <View style={[styles.goalIcon, { backgroundColor: '#FF6B6B20' }]}>
              <Footprints size={22} color="#FF6B6B" />
            </View>
            <View style={styles.goalInfo}>
              <Text style={styles.goalLabel}>Steps Goal</Text>
              <Text style={styles.goalDescription}>Target daily steps</Text>
            </View>
            <View style={styles.goalInputContainer}>
              <TextInput
                style={[styles.goalInput, { minWidth: 80 }]}
                value={stepsGoal}
                onChangeText={setStepsGoal}
                keyboardType="numeric"
                maxLength={6}
              />
            </View>
          </View>
        </View>

        <TouchableOpacity style={[styles.saveButton, SHADOWS.card]} onPress={handleSave}>
          <Check size={20} color="#FFFFFF" />
          <Text style={styles.saveButtonText}>Save Goals</Text>
        </TouchableOpacity>

        <Text style={styles.note}>
          Goals are shown on charts as reference lines and used to track your progress.
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>

      <Toast
        visible={toastVisible}
        message={toastMessage}
        onHide={() => setToastVisible(false)}
      />
    </View>
  );
}

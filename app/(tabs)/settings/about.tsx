import React, { useState, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Share, Download, Target, Info } from 'lucide-react-native';
import * as Sharing from 'expo-sharing';
import { useTheme } from '../../../contexts/ThemeContext';
import { useData } from '../../../contexts/DataContext';
import { SHADOWS } from '../../../constants/theme';
import Toast from '../../../components/Toast';

export default function AboutScreen() {
  const { colors } = useTheme();
  const { settings, updateSettings, exportBackup } = useData();
  const [exporting, setExporting] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setToastVisible(true);
  }, []);

  const handleExport = useCallback(async () => {
    try {
      setExporting(true);
      const backupJson = await exportBackup();
      
      if (Platform.OS === 'web') {
        const blob = new Blob([backupJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `effective-day-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Backup downloaded');
      } else {
        if (await Sharing.isAvailableAsync()) {
          const dataUri = `data:application/json;base64,${btoa(unescape(encodeURIComponent(backupJson)))}`;
          await Sharing.shareAsync(dataUri, {
            mimeType: 'application/json',
            dialogTitle: 'Export Backup',
          });
        } else {
          Alert.alert('Info', 'Sharing is not available on this device');
        }
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'Failed to export backup');
    } finally {
      setExporting(false);
    }
  }, [exportBackup, showToast]);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 16,
    },
    card: {
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 16,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.primaryText,
    },
    settingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    settingRowNoBorder: {
      borderBottomWidth: 0,
    },
    settingLabel: {
      fontSize: 14,
      color: colors.primaryText,
    },
    settingInput: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.primaryText,
      paddingVertical: 8,
      paddingHorizontal: 16,
      backgroundColor: colors.background,
      borderRadius: 8,
      minWidth: 80,
      textAlign: 'center',
    },
    backupInfo: {
      fontSize: 13,
      color: colors.secondaryText,
      marginBottom: 16,
      lineHeight: 20,
    },
    exportButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.highlight,
      paddingVertical: 14,
      borderRadius: 12,
    },
    exportButtonDisabled: {
      opacity: 0.6,
    },
    exportButtonText: {
      fontSize: 15,
      fontWeight: '600' as const,
      color: '#FFFFFF',
    },
    versionContainer: {
      alignItems: 'center',
      paddingVertical: 24,
    },
    versionText: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.primaryText,
    },
    versionSubtext: {
      fontSize: 13,
      color: colors.secondaryText,
      marginTop: 6,
      textAlign: 'center',
    },
  }), [colors]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={[styles.card, SHADOWS.card]}>
          <View style={styles.cardHeader}>
            <Info size={20} color={colors.highlight} />
            <Text style={styles.cardTitle}>App Information</Text>
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Version</Text>
            <Text style={[styles.settingLabel, { fontWeight: '600' as const }]}>1.0.0</Text>
          </View>

          <View style={[styles.settingRow, styles.settingRowNoBorder]}>
            <Text style={styles.settingLabel}>Build</Text>
            <Text style={[styles.settingLabel, { fontWeight: '600' as const }]}>2026.01</Text>
          </View>
        </View>

        <View style={[styles.card, SHADOWS.card]}>
          <View style={styles.cardHeader}>
            <Target size={20} color={colors.highlight} />
            <Text style={styles.cardTitle}>Goals</Text>
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>ER Goal</Text>
            <Text style={[styles.settingLabel, { fontWeight: '600' as const }]}>
              {(settings.erGoal * 100).toFixed(0)}%
            </Text>
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Sleep Goal</Text>
            <Text style={[styles.settingLabel, { fontWeight: '600' as const }]}>
              {settings.sleepGoal} hours
            </Text>
          </View>

          <View style={[styles.settingRow, styles.settingRowNoBorder]}>
            <Text style={styles.settingLabel}>Steps Goal</Text>
            <Text style={[styles.settingLabel, { fontWeight: '600' as const }]}>
              {settings.stepsGoal.toLocaleString()}
            </Text>
          </View>
        </View>

        <View style={[styles.card, SHADOWS.card]}>
          <View style={styles.cardHeader}>
            <Download size={20} color={colors.highlight} />
            <Text style={styles.cardTitle}>Backups</Text>
          </View>

          <Text style={styles.backupInfo}>
            Export your data as a JSON file. Backups include all tracked days, settings, habits, and activities.
          </Text>

          <TouchableOpacity 
            style={[styles.exportButton, exporting && styles.exportButtonDisabled]}
            onPress={handleExport}
            disabled={exporting}
          >
            <Share size={18} color="#FFFFFF" />
            <Text style={styles.exportButtonText}>
              {exporting ? 'Exporting...' : 'Export Backup (JSON)'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Effective Day Tracker</Text>
          <Text style={styles.versionSubtext}>Track your time, maximize your potential</Text>
        </View>
      </View>

      <Toast
        visible={toastVisible}
        message={toastMessage}
        onHide={() => setToastVisible(false)}
      />
    </ScrollView>
  );
}

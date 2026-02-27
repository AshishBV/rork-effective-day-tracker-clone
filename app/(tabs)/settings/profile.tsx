import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Check } from 'lucide-react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { useData } from '../../../contexts/DataContext';
import { SHADOWS } from '../../../constants/theme';
import Toast from '../../../components/Toast';

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { settings, updateSettings } = useData();
  const [displayName, setDisplayName] = useState(settings.displayName || 'Ashish');
  const [toastVisible, setToastVisible] = useState(false);

  const handleSave = useCallback(() => {
    const trimmedName = displayName.trim() || 'Ashish';
    updateSettings({ displayName: trimmedName });
    setDisplayName(trimmedName);
    setToastVisible(true);
  }, [displayName, updateSettings]);

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
      padding: 20,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    label: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.secondaryText,
      marginBottom: 8,
    },
    input: {
      fontSize: 18,
      fontWeight: '500' as const,
      color: colors.primaryText,
      paddingVertical: 14,
      paddingHorizontal: 16,
      backgroundColor: colors.background,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    hint: {
      fontSize: 13,
      color: colors.secondaryText,
      marginTop: 12,
      lineHeight: 18,
    },
    saveButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.highlight,
      paddingVertical: 14,
      borderRadius: 12,
      marginTop: 20,
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: '#FFFFFF',
    },
  }), [colors]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={[styles.card, SHADOWS.card]}>
          <Text style={styles.label}>Display Name</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Enter your name"
            placeholderTextColor={colors.secondaryText}
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={handleSave}
          />
          <Text style={styles.hint}>
            This name will be shown in greetings and messages throughout the app.
          </Text>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Check size={20} color="#FFFFFF" />
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Toast
        visible={toastVisible}
        message="Profile updated!"
        onHide={() => setToastVisible(false)}
      />
    </ScrollView>
  );
}

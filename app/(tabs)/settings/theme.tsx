import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { SHADOWS } from '../../../constants/theme';
import ThemeSelector from '../../../components/ThemeSelector';
import { ThemeMode } from '../../../types/data';

export default function ThemeScreen() {
  const { colors, themeMode, setThemeMode, autoStatus } = useTheme();

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
    description: {
      fontSize: 14,
      color: colors.secondaryText,
      marginBottom: 20,
      lineHeight: 20,
    },
  }), [colors]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={[styles.card, SHADOWS.card]}>
          <Text style={styles.description}>
            Choose how the app looks. System follows your device settings, while Auto switches based on sunrise/sunset times.
          </Text>
          <ThemeSelector
            currentMode={themeMode}
            onSelect={(mode: ThemeMode) => setThemeMode(mode)}
            autoStatus={autoStatus}
          />
        </View>
      </View>
    </ScrollView>
  );
}

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Sun, Moon, Smartphone, Sunrise } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';
import { ThemeMode } from '../types/data';

interface ThemeSelectorProps {
  currentMode: ThemeMode;
  onSelect: (mode: ThemeMode) => void;
  autoStatus: string | null;
}

export default function ThemeSelector({ currentMode, onSelect, autoStatus }: ThemeSelectorProps) {
  const { colors } = useTheme();

  const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: React.ReactNode }[] = [
    { mode: 'light', label: 'Light', icon: <Sun size={18} color={colors.highlight} /> },
    { mode: 'dark', label: 'Dark', icon: <Moon size={18} color={colors.highlight} /> },
    { mode: 'system', label: 'System', icon: <Smartphone size={18} color={colors.highlight} /> },
    { mode: 'auto', label: 'Auto', icon: <Sunrise size={18} color={colors.highlight} /> },
  ];

  const handleSelect = (mode: ThemeMode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelect(mode);
  };

  const styles = useMemo(() => StyleSheet.create({
    container: {
      marginTop: 8,
    },
    optionsRow: {
      flexDirection: 'row',
      gap: 8,
    },
    option: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 8,
      borderRadius: 12,
      backgroundColor: colors.background,
      borderWidth: 2,
      borderColor: 'transparent',
      gap: 6,
    },
    optionSelected: {
      borderColor: colors.highlight,
      backgroundColor: `${colors.highlight}10`,
    },
    optionLabel: {
      fontSize: 12,
      fontWeight: '500' as const,
      color: colors.secondaryText,
    },
    optionLabelSelected: {
      color: colors.highlight,
      fontWeight: '600' as const,
    },
    autoStatus: {
      fontSize: 12,
      color: colors.highlight,
      textAlign: 'center',
      marginTop: 12,
      fontStyle: 'italic',
    },
    hint: {
      fontSize: 12,
      color: colors.secondaryText,
      textAlign: 'center',
      marginTop: 8,
    },
  }), [colors]);

  return (
    <View style={styles.container}>
      <View style={styles.optionsRow}>
        {THEME_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.mode}
            style={[styles.option, currentMode === option.mode && styles.optionSelected]}
            onPress={() => handleSelect(option.mode)}
          >
            {option.icon}
            <Text style={[styles.optionLabel, currentMode === option.mode && styles.optionLabelSelected]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {currentMode === 'auto' && autoStatus && (
        <Text style={styles.autoStatus}>{autoStatus}</Text>
      )}
      
      <Text style={styles.hint}>
        {currentMode === 'light' && 'Always use light theme'}
        {currentMode === 'dark' && 'Always use dark theme'}
        {currentMode === 'system' && 'Follow your device settings'}
        {currentMode === 'auto' && 'Switch based on sunrise/sunset times'}
      </Text>
    </View>
  );
}

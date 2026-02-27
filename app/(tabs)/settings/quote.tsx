import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Check } from 'lucide-react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { useData } from '../../../contexts/DataContext';
import { SHADOWS } from '../../../constants/theme';
import { DEFAULT_QUOTE } from '../../../types/data';
import Toast from '../../../components/Toast';

export default function QuoteScreen() {
  const { colors } = useTheme();
  const { settings, updateSettings } = useData();
  const [quoteText, setQuoteText] = useState(settings.quoteText || DEFAULT_QUOTE);
  const [toastVisible, setToastVisible] = useState(false);

  const handleSave = useCallback(() => {
    updateSettings({ quoteText: quoteText.trim() || DEFAULT_QUOTE });
    setToastVisible(true);
  }, [quoteText, updateSettings]);

  const handleReset = useCallback(() => {
    setQuoteText(DEFAULT_QUOTE);
    updateSettings({ quoteText: DEFAULT_QUOTE });
    setToastVisible(true);
  }, [updateSettings]);

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
      fontSize: 15,
      color: colors.primaryText,
      paddingVertical: 14,
      paddingHorizontal: 16,
      backgroundColor: colors.background,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.cardBorder,
      minHeight: 120,
      textAlignVertical: 'top' as const,
      lineHeight: 22,
    },
    hint: {
      fontSize: 13,
      color: colors.secondaryText,
      marginTop: 12,
      lineHeight: 18,
    },
    buttonsRow: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 20,
    },
    saveButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: colors.highlight,
      paddingVertical: 14,
      borderRadius: 12,
    },
    resetButton: {
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderRadius: 12,
      backgroundColor: colors.divider,
    },
    saveButtonText: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: '#FFFFFF',
    },
    resetButtonText: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.primaryText,
    },
  }), [colors]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={[styles.card, SHADOWS.card]}>
          <Text style={styles.label}>Daily Affirmation</Text>
          <TextInput
            style={styles.input}
            value={quoteText}
            onChangeText={setQuoteText}
            placeholder="Enter your daily affirmation..."
            placeholderTextColor={colors.secondaryText}
            multiline
            numberOfLines={5}
          />
          <Text style={styles.hint}>
            This quote will be displayed on your Home screen to inspire you throughout the day.
          </Text>
          <View style={styles.buttonsRow}>
            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Check size={20} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Save Quote</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <Toast
        visible={toastVisible}
        message="Quote updated!"
        onHide={() => setToastVisible(false)}
      />
    </ScrollView>
  );
}

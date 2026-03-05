import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Lock } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface PremiumLockProps {
  message?: string;
  compact?: boolean;
}

export default function PremiumLock({ message, compact = false }: PremiumLockProps) {
  const { colors } = useTheme();

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: compact ? 0 : 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: compact ? 32 : 60,
      paddingHorizontal: 32,
    },
    iconContainer: {
      width: compact ? 48 : 64,
      height: compact ? 48 : 64,
      borderRadius: compact ? 24 : 32,
      backgroundColor: colors.divider,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    title: {
      fontSize: compact ? 15 : 18,
      fontWeight: '500' as const,
      color: colors.primaryText,
      marginBottom: 8,
      textAlign: 'center' as const,
    },
    subtitle: {
      fontSize: 13,
      color: colors.secondaryText,
      textAlign: 'center' as const,
      lineHeight: 20,
      fontStyle: 'italic' as const,
    },
  }), [colors, compact]);

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Lock size={compact ? 20 : 28} color={colors.secondaryText} />
      </View>
      <Text style={styles.title}>Premium Feature</Text>
      <Text style={styles.subtitle}>
        {message || 'Enter invite code in Settings to unlock this feature.'}
      </Text>
    </View>
  );
}

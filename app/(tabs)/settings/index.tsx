import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { 
  User, 
  Palette, 
  Quote, 
  Layers, 
  Bell, 
  Info,
  ChevronRight,
  Clock,
  Target,
  ListChecks,
  Paintbrush,
  Check,
} from 'lucide-react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { useData } from '../../../contexts/DataContext';
import { useActivities } from '../../../contexts/ActivitiesContext';
import { SHADOWS } from '../../../constants/theme';

import { DEFAULT_QUOTE } from '../../../types/data';

interface SettingsRowProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
}

function SettingsRow({ icon, title, subtitle, onPress, colors }: SettingsRowProps) {
  const styles = useMemo(() => StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
      backgroundColor: colors.cardBackground,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    iconContainer: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 14,
    },
    content: {
      flex: 1,
    },
    title: {
      fontSize: 16,
      fontWeight: '500' as const,
      color: colors.primaryText,
    },
    subtitle: {
      fontSize: 13,
      color: colors.secondaryText,
      marginTop: 2,
    },
    chevron: {
      marginLeft: 8,
    },
  }), [colors]);

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.iconContainer}>{icon}</View>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
      </View>
      <ChevronRight size={20} color={colors.secondaryText} style={styles.chevron} />
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, themeMode } = useTheme();
  const { settings } = useData();
  const { activeActivities } = useActivities();

  const { updateSettings } = useData();
  const [showBannerPicker, setShowBannerPicker] = useState(false);
  const displayName = settings.displayName || 'Ashish';

  const BANNER_COLORS = [
    '#344e41', '#99582a', '#283618', '#bb9457', '#560bad',
    '#a53860', '#003566', '#606c38', '#005f73', '#432818',
    '#fb8500', '#52796f', '#cbf3f0', '#0A0A0A',
  ];

  const handleBannerColorSelect = useCallback((color: string) => {
    updateSettings({ bannerColor: color });
  }, [updateSettings]);
  const quoteText = settings.quoteText || DEFAULT_QUOTE;
  const truncatedQuote = quoteText.length > 35 ? quoteText.substring(0, 35) + '...' : quoteText;

  const getThemeLabel = () => {
    switch (themeMode) {
      case 'light': return 'Light';
      case 'dark': return 'Dark';
      case 'system': return 'System';
      case 'auto': return 'Auto (Sunrise/Sunset)';
      default: return 'Light';
    }
  };

  const getNotificationsLabel = () => {
    const parts: string[] = [];
    if (settings.notificationsEnabled) {
      const freq = settings.notificationFrequency ?? 15;
      const label = freq === 'custom' ? `${settings.customNotificationMinutes ?? 45}min` : `${freq}min`;
      parts.push(`${label}: On`);
    } else {
      parts.push('Reminders: Off');
    }
    if (settings.dailyReminderEnabled ?? true) parts.push('8PM: On');
    else parts.push('8PM: Off');
    return parts.join(', ');
  };

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    section: {
      marginTop: 20,
      marginHorizontal: 16,
      borderRadius: 16,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '600' as const,
      color: colors.secondaryText,
      marginLeft: 20,
      marginTop: 24,
      marginBottom: 8,
      textTransform: 'uppercase' as const,
      letterSpacing: 0.5,
    },
    lastRow: {
      borderBottomWidth: 0,
    },
    versionContainer: {
      alignItems: 'center',
      paddingVertical: 32,
    },
    versionText: {
      fontSize: 13,
      color: colors.secondaryText,
    },
    colorPickerContainer: {
      marginHorizontal: 16,
      marginTop: 8,
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    colorGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      justifyContent: 'center',
    },
    colorSwatch: {
      width: 42,
      height: 42,
      borderRadius: 21,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    colorSwatchSelected: {
      borderColor: '#FFFFFF',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 4,
    },
  }), [colors]);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>General</Text>
        <View style={[styles.section, SHADOWS.card]}>
          <SettingsRow
            icon={<User size={20} color={colors.highlight} />}
            title="Profile"
            subtitle={displayName}
            onPress={() => router.push('/settings/profile' as any)}
            colors={colors}
          />
          <SettingsRow
            icon={<Palette size={20} color={colors.highlight} />}
            title="Theme"
            subtitle={getThemeLabel()}
            onPress={() => router.push('/settings/theme' as any)}
            colors={colors}
          />
          <SettingsRow
            icon={<Quote size={20} color={colors.highlight} />}
            title="Quote / Affirmation"
            subtitle={truncatedQuote}
            onPress={() => router.push('/settings/quote' as any)}
            colors={colors}
          />
          <View style={styles.lastRow}>
            <SettingsRow
              icon={<Paintbrush size={20} color={colors.highlight} />}
              title="Banner Color"
              subtitle="Customize ER banner"
              onPress={() => setShowBannerPicker(!showBannerPicker)}
              colors={colors}
            />
          </View>
        </View>
        {showBannerPicker && (
          <View style={styles.colorPickerContainer}>
            <View style={styles.colorGrid}>
              {BANNER_COLORS.map((color) => {
                const isSelected = (settings.bannerColor || '#0A0A0A') === color;
                return (
                  <TouchableOpacity
                    key={color}
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: color },
                      isSelected && styles.colorSwatchSelected,
                    ]}
                    onPress={() => handleBannerColorSelect(color)}
                    activeOpacity={0.7}
                  >
                    {isSelected && <Check size={16} color="#FFFFFF" />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        <Text style={styles.sectionTitle}>Tracking</Text>
        <View style={[styles.section, SHADOWS.card]}>
          <SettingsRow
            icon={<Layers size={20} color={colors.highlight} />}
            title="Activities (Codes & Points)"
            subtitle={`${activeActivities.length} active`}
            onPress={() => router.push('/settings/activities' as any)}
            colors={colors}
          />
          <SettingsRow
            icon={<Clock size={20} color={colors.highlight} />}
            title="Time Settings"
            subtitle={`${settings.timeSettings?.slotDuration || 15} min slots`}
            onPress={() => router.push('/settings/time' as any)}
            colors={colors}
          />
          <SettingsRow
            icon={<ListChecks size={20} color={colors.highlight} />}
            title="Manage Habits"
            subtitle={`${(settings.customHabits || []).filter(h => h.active).length} active habits`}
            onPress={() => router.push('/settings/habits' as any)}
            colors={colors}
          />
          <View style={styles.lastRow}>
            <SettingsRow
              icon={<Target size={20} color={colors.highlight} />}
              title="Goals"
              subtitle={`ER: ${settings.erGoal}%, Sleep: ${settings.sleepGoal}h`}
              onPress={() => router.push('/settings/goals' as any)}
              colors={colors}
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={[styles.section, SHADOWS.card]}>
          <View style={styles.lastRow}>
            <SettingsRow
              icon={<Bell size={20} color={colors.highlight} />}
              title="Notifications"
              subtitle={getNotificationsLabel()}
              onPress={() => router.push('/settings/notifications' as any)}
              colors={colors}
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>App</Text>
        <View style={[styles.section, SHADOWS.card]}>
          <View style={styles.lastRow}>
            <SettingsRow
              icon={<Info size={20} color={colors.highlight} />}
              title="About"
              subtitle="v1.0.0"
              onPress={() => router.push('/settings/about' as any)}
              colors={colors}
            />
          </View>
        </View>

        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Effective Day Tracker</Text>
        </View>
      </ScrollView>
    </View>
  );
}

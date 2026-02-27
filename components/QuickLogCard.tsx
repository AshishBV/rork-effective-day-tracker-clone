import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable, Dimensions } from 'react-native';
import { MoreHorizontal } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';
import { useActivities } from '../contexts/ActivitiesContext';
import { SHADOWS } from '../constants/theme';
import { TimeSlot } from '../types/data';
import AnimatedPressable from './AnimatedPressable';

interface QuickLogCardProps {
  previousSlot: TimeSlot | null;
  onCategorySelect: (category: string) => void;
  onEditSlot: () => void;
  onJumpToNow: () => void;
  displayName?: string;
}

const MAX_VISIBLE_BUTTONS = 7;

export default function QuickLogCard({ 
  previousSlot, 
  onCategorySelect, 
  onEditSlot,
  onJumpToNow,
  displayName = 'Ashish',
}: QuickLogCardProps) {
  const { colors } = useTheme();
  const { activeActivities, getActivityByCode } = useActivities();
  const [moreModalVisible, setMoreModalVisible] = useState(false);
  const isLogged = previousSlot?.activityCategory !== null;
  
  const screenWidth = Dimensions.get('window').width;
  const cardPadding = 16 * 2;
  const cardMargin = 16 * 2;
  const availableWidth = screenWidth - cardMargin - cardPadding;
  const buttonCount = Math.min(activeActivities.length, MAX_VISIBLE_BUTTONS);
  const gapSize = 6;
  const totalGaps = (buttonCount - 1) * gapSize;
  const buttonWidth = Math.floor((availableWidth - totalGaps) / buttonCount);

  const visibleActivities = activeActivities.slice(0, MAX_VISIBLE_BUTTONS);
  const overflowActivities = activeActivities.slice(MAX_VISIBLE_BUTTONS);
  const hasOverflow = overflowActivities.length > 0;

  const styles = useMemo(() => StyleSheet.create({
    card: {
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 16,
      marginHorizontal: 16,
      marginVertical: 8,
      borderWidth: 1,
      borderColor: colors.cardBorder,
    },
    header: {
      marginBottom: 12,
    },
    title: {
      fontSize: 14,
      fontWeight: '400' as const,
      fontStyle: 'italic' as const,
      color: colors.primaryText,
      marginBottom: 4,
      letterSpacing: 0.3,
      opacity: 0.85,
    },
    subtitle: {
      fontSize: 13,
      fontWeight: '300' as const,
      fontStyle: 'italic' as const,
      color: colors.secondaryText,
    },
    timeRange: {
      fontSize: 15,
      fontWeight: '400' as const,
      fontStyle: 'italic' as const,
      color: 'rgba(130,130,130,1)',
      letterSpacing: 0.2,
    },
    buttonsRow: {
      flexDirection: 'row',
      gap: 6,
      flexWrap: 'nowrap',
    },
    categoryButton: {
      paddingVertical: 10,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    categoryButtonText: {
      fontSize: 12,
      fontWeight: '300' as const,
      fontStyle: 'italic' as const,
      letterSpacing: 0.3,
    },
    loggedContainer: {
      gap: 12,
    },
    loggedMessage: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 8,
    },
    loggedText: {
      fontSize: 14,
      color: colors.secondaryText,
      flex: 1,
    },
    currentCategory: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
    },
    currentCategoryText: {
      fontSize: 12,
      fontWeight: '600' as const,
    },
    loggedActions: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 10,
      backgroundColor: colors.highlight,
      alignItems: 'center',
    },
    actionButtonSecondary: {
      backgroundColor: colors.divider,
    },
    actionButtonText: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: '#FFFFFF',
    },
    actionButtonTextSecondary: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.primaryText,
    },
    moreButton: {
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.divider,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    modalContent: {
      backgroundColor: colors.cardBackground,
      borderRadius: 16,
      padding: 20,
      width: '100%',
      maxWidth: 320,
    },
    modalTitle: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.primaryText,
      marginBottom: 16,
      textAlign: 'center',
    },
    modalGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      justifyContent: 'center',
    },
    modalButton: {
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 10,
      minWidth: 60,
      alignItems: 'center',
    },
  }), [colors]);

  const currentActivity = previousSlot?.activityCategory ? getActivityByCode(previousSlot.activityCategory) : null;

  if (!previousSlot) {
    return (
      <View style={[styles.card, SHADOWS.card]}>
        <Text style={styles.title}>Quick Log</Text>
        <Text style={styles.subtitle}>No slots completed yet</Text>
      </View>
    );
  }

  return (
    <View style={[styles.card, SHADOWS.card]}>
      <View style={styles.header}>
        <Text style={styles.title}>Quick Log Previous Slot</Text>
        <Text style={styles.timeRange}>{previousSlot.timeIn} → {previousSlot.timeOut}</Text>
      </View>

      {isLogged && currentActivity ? (
        <View style={styles.loggedContainer}>
          <View style={styles.loggedMessage}>
            <Text style={styles.loggedText}>You have filled all your slots, {displayName}.</Text>
            <View style={[
              styles.currentCategory, 
              { backgroundColor: currentActivity.color }
            ]}>
              <Text style={[
                styles.currentCategoryText,
                { color: currentActivity.textColor }
              ]}>
                {currentActivity.name}
              </Text>
            </View>
          </View>
          <View style={styles.loggedActions}>
            <TouchableOpacity style={styles.actionButton} onPress={onEditSlot}>
              <Text style={styles.actionButtonText}>Edit Previous Slot</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.actionButtonSecondary]} onPress={onJumpToNow}>
              <Text style={styles.actionButtonTextSecondary}>Jump to Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.buttonsRow}>
          {visibleActivities.map((activity) => (
            <AnimatedPressable
              key={activity.id}
              style={[
                styles.categoryButton,
                { backgroundColor: activity.color, width: buttonWidth }
              ]}
              onPress={() => onCategorySelect(activity.code)}
              haptic
              scaleDown={0.94}
            >
              <Text style={[styles.categoryButtonText, { color: activity.textColor }]}>
                {activity.code}
              </Text>
            </AnimatedPressable>
          ))}
          {hasOverflow && (
            <TouchableOpacity
              style={[styles.moreButton, { width: buttonWidth }]}
              onPress={() => setMoreModalVisible(true)}
            >
              <MoreHorizontal size={16} color={colors.primaryText} />
            </TouchableOpacity>
          )}
        </View>
      )}

      <Modal visible={moreModalVisible} transparent animationType="fade">
        <Pressable style={styles.modalOverlay} onPress={() => setMoreModalVisible(false)}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Activity</Text>
            <View style={styles.modalGrid}>
              {activeActivities.map((activity) => (
                <TouchableOpacity
                  key={activity.id}
                  style={[styles.modalButton, { backgroundColor: activity.color }]}
                  onPress={() => {
                    onCategorySelect(activity.code);
                    setMoreModalVisible(false);
                  }}
                >
                  <Text style={[styles.categoryButtonText, { color: activity.textColor }]}>
                    {activity.code}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

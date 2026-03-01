import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

interface TimePickerModalProps {
  visible: boolean;
  value: Date;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  secondaryTextColor?: string;
}

function generateHours(): number[] {
  const hours: number[] = [];
  for (let i = 1; i <= 12; i++) {
    hours.push(i);
  }
  return hours;
}

function generateMinutes(): number[] {
  const minutes: number[] = [];
  for (let i = 0; i < 60; i++) {
    minutes.push(i);
  }
  return minutes;
}

const HOURS = generateHours();
const MINUTES = generateMinutes();
const PERIODS = ['AM', 'PM'] as const;

function PickerColumn({
  items,
  selectedIndex,
  onSelect,
  textColor,
  secondaryTextColor,
  accentColor,
  formatItem,
}: {
  items: readonly (string | number)[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  textColor: string;
  secondaryTextColor: string;
  accentColor: string;
  formatItem?: (item: string | number) => string;
}) {
  const scrollRef = useRef<ScrollView>(null);
  const isUserScrolling = useRef(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      scrollRef.current?.scrollTo({
        y: selectedIndex * ITEM_HEIGHT,
        animated: false,
      });
    }, 50);
    return () => clearTimeout(timeout);
  }, []);

  const handleMomentumEnd = useCallback(
    (event: { nativeEvent: { contentOffset: { y: number } } }) => {
      const y = event.nativeEvent.contentOffset.y;
      const index = Math.round(y / ITEM_HEIGHT);
      const clampedIndex = Math.max(0, Math.min(index, items.length - 1));
      if (clampedIndex !== selectedIndex) {
        onSelect(clampedIndex);
      }
      scrollRef.current?.scrollTo({
        y: clampedIndex * ITEM_HEIGHT,
        animated: true,
      });
      isUserScrolling.current = false;
    },
    [items.length, selectedIndex, onSelect]
  );

  return (
    <View style={pickerStyles.columnContainer}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onMomentumScrollEnd={handleMomentumEnd}
        onScrollBeginDrag={() => {
          isUserScrolling.current = true;
        }}
        contentContainerStyle={{
          paddingVertical: ITEM_HEIGHT * 2,
        }}
        style={{ height: PICKER_HEIGHT }}
      >
        {items.map((item, index) => {
          const isSelected = index === selectedIndex;
          return (
            <TouchableOpacity
              key={`${item}-${index}`}
              style={pickerStyles.item}
              onPress={() => {
                onSelect(index);
                scrollRef.current?.scrollTo({
                  y: index * ITEM_HEIGHT,
                  animated: true,
                });
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  pickerStyles.itemText,
                  {
                    color: isSelected ? accentColor : secondaryTextColor,
                    fontWeight: isSelected ? '700' : '400',
                    fontSize: isSelected ? 22 : 17,
                    opacity: isSelected ? 1 : 0.5,
                  },
                ]}
              >
                {formatItem ? formatItem(item) : String(item)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const pickerStyles = StyleSheet.create({
  columnContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  item: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: {
    textAlign: 'center',
  },
});

export default function TimePickerModal({
  visible,
  value,
  onConfirm,
  onCancel,
  accentColor = '#007AFF',
  backgroundColor = '#FFFFFF',
  textColor = '#000000',
  secondaryTextColor = '#8E8E93',
}: TimePickerModalProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;

  const hours24 = value.getHours();
  const isPM = hours24 >= 12;
  const hour12 = hours24 % 12 || 12;

  const [selectedHourIndex, setSelectedHourIndex] = useState(() =>
    HOURS.indexOf(hour12)
  );
  const [selectedMinuteIndex, setSelectedMinuteIndex] = useState(
    value.getMinutes()
  );
  const [selectedPeriodIndex, setSelectedPeriodIndex] = useState(
    isPM ? 1 : 0
  );

  useEffect(() => {
    if (visible) {
      const h24 = value.getHours();
      const pm = h24 >= 12;
      const h12 = h24 % 12 || 12;
      setSelectedHourIndex(HOURS.indexOf(h12));
      setSelectedMinuteIndex(value.getMinutes());
      setSelectedPeriodIndex(pm ? 1 : 0);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 20,
          stiffness: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 300,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, value]);

  const handleConfirm = useCallback(() => {
    const hour = HOURS[selectedHourIndex];
    const minute = MINUTES[selectedMinuteIndex];
    const period = PERIODS[selectedPeriodIndex];

    let hours24Val = hour;
    if (period === 'AM' && hour === 12) hours24Val = 0;
    else if (period === 'PM' && hour !== 12) hours24Val = hour + 12;

    const newDate = new Date(value);
    newDate.setHours(hours24Val, minute, 0, 0);
    onConfirm(newDate);
  }, [selectedHourIndex, selectedMinuteIndex, selectedPeriodIndex, value, onConfirm]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        overlay: {
          flex: 1,
          justifyContent: 'flex-end',
          backgroundColor: 'rgba(0,0,0,0.4)',
        },
        sheet: {
          backgroundColor,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          paddingBottom: 34,
          overflow: 'hidden',
        },
        handle: {
          alignSelf: 'center',
          width: 36,
          height: 5,
          borderRadius: 3,
          backgroundColor: secondaryTextColor,
          opacity: 0.3,
          marginTop: 10,
          marginBottom: 6,
        },
        header: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 12,
        },
        headerButton: {
          paddingVertical: 6,
          paddingHorizontal: 4,
        },
        cancelText: {
          fontSize: 16,
          color: secondaryTextColor,
        },
        confirmText: {
          fontSize: 16,
          fontWeight: '600' as const,
          color: accentColor,
        },
        title: {
          fontSize: 16,
          fontWeight: '600' as const,
          color: textColor,
        },
        pickerRow: {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          height: PICKER_HEIGHT,
        },
        separator: {
          fontSize: 24,
          fontWeight: '700' as const,
          color: textColor,
          marginHorizontal: 2,
        },
        highlightBar: {
          position: 'absolute',
          left: 16,
          right: 16,
          top: ITEM_HEIGHT * 2,
          height: ITEM_HEIGHT,
          backgroundColor: accentColor,
          opacity: 0.1,
          borderRadius: 10,
        },
      }),
    [backgroundColor, textColor, secondaryTextColor, accentColor]
  );

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onCancel}>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onCancel} />
        <Animated.View
          style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            <TouchableOpacity style={styles.headerButton} onPress={onCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Select Time</Text>
            <TouchableOpacity style={styles.headerButton} onPress={handleConfirm}>
              <Text style={styles.confirmText}>Done</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.pickerRow}>
            <View style={styles.highlightBar} />
            <PickerColumn
              items={HOURS}
              selectedIndex={selectedHourIndex}
              onSelect={setSelectedHourIndex}
              textColor={textColor}
              secondaryTextColor={secondaryTextColor}
              accentColor={accentColor}
            />
            <Text style={styles.separator}>:</Text>
            <PickerColumn
              items={MINUTES}
              selectedIndex={selectedMinuteIndex}
              onSelect={setSelectedMinuteIndex}
              textColor={textColor}
              secondaryTextColor={secondaryTextColor}
              accentColor={accentColor}
              formatItem={(item) => String(item).padStart(2, '0')}
            />
            <PickerColumn
              items={PERIODS}
              selectedIndex={selectedPeriodIndex}
              onSelect={setSelectedPeriodIndex}
              textColor={textColor}
              secondaryTextColor={secondaryTextColor}
              accentColor={accentColor}
            />
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

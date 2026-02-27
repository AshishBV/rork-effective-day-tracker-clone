import React, { useCallback } from 'react';
import { Pressable, StyleSheet, ViewStyle, Platform } from 'react-native';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics';

interface AnimatedPressableProps {
  children: React.ReactNode;
  onPress: () => void;
  style?: ViewStyle;
  disabled?: boolean;
  haptic?: boolean;
  scaleDown?: number;
}

export default function AnimatedPressable({ 
  children, 
  onPress, 
  style, 
  disabled = false,
  haptic = true,
  scaleDown = 0.96,
}: AnimatedPressableProps) {
  const [pressed, setPressed] = React.useState(false);

  const handlePressIn = useCallback(() => {
    setPressed(true);
    if (haptic && Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [haptic]);

  const handlePressOut = useCallback(() => {
    setPressed(false);
  }, []);

  const handlePress = useCallback(() => {
    onPress();
  }, [onPress]);

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled}
      style={styles.pressable}
    >
      <MotiView
        animate={{
          scale: pressed ? scaleDown : 1,
        }}
        transition={{
          type: 'timing',
          duration: 100,
        }}
        style={style}
      >
        {children}
      </MotiView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    alignSelf: 'flex-start',
  },
});

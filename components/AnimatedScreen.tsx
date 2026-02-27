import React, { useEffect, useRef, useMemo } from 'react';
import { StyleSheet, Animated } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';

interface AnimatedScreenProps {
  children: React.ReactNode;
  style?: object;
}

export default function AnimatedScreen({ children, style }: AnimatedScreenProps) {
  const isFocused = useIsFocused();
  const { colors } = useTheme();
  
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    if (isFocused) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      opacity.setValue(0);
      translateY.setValue(6);
    }
  }, [isFocused, opacity, translateY]);

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
  }), [colors]);

  return (
    <Animated.View
      style={[
        styles.container,
        style,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

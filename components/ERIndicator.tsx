import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../contexts/ThemeContext';

interface ERIndicatorProps {
  percentage: number;
  size?: number;
}

export default function ERIndicator({ percentage, size = 100 }: ERIndicatorProps) {
  const { colors } = useTheme();
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(percentage, 0), 1);
  const strokeDashoffset = circumference * (1 - progress);

  const getColor = () => {
    if (progress >= 0.8) return colors.success;
    if (progress >= 0.5) return colors.highlight;
    return colors.error;
  };

  const styles = useMemo(() => StyleSheet.create({
    container: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    textContainer: {
      position: 'absolute',
      alignItems: 'center',
    },
    label: {
      fontSize: 12,
      fontWeight: '600' as const,
      color: colors.secondaryText,
    },
    percentage: {
      fontSize: 20,
      fontWeight: '700' as const,
    },
  }), [colors]);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.divider}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getColor()}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.textContainer}>
        <Text style={styles.label}>ER</Text>
        <Text style={[styles.percentage, { color: getColor() }]}>
          {Math.round(progress * 100)}%
        </Text>
      </View>
    </View>
  );
}

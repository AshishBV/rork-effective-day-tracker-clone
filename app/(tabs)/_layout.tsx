import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Tabs } from 'expo-router';
import { Calendar, BarChart3, Settings, ClipboardList, Target } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Animated, AccessibilityInfo } from 'react-native';

const AnimatedTabIcon = React.memo(function AnimatedTabIcon({
  children,
  focused,
}: {
  children: React.ReactNode;
  focused: boolean;
}) {
  const scale = useRef(new Animated.Value(focused ? 1.03 : 1)).current;
  const opacity = useRef(new Animated.Value(focused ? 1 : 0.85)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: focused ? 1.03 : 1,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: focused ? 1 : 0.85,
        duration: 120,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused, scale, opacity]);

  return (
    <Animated.View style={{ transform: [{ scale }], opacity }}>
      {children}
    </Animated.View>
  );
});

export default function TabLayout() {
  const { colors } = useTheme();
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription?.remove?.();
  }, []);

  const tabBarStyle = useMemo(
    () => ({
      backgroundColor: colors.cardBackground,
      borderTopColor: colors.divider,
      borderTopWidth: 1,
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    }),
    [colors.cardBackground, colors.divider]
  );

  const tabBarLabelStyle = useMemo(
    () => ({
      fontSize: 11,
      fontWeight: '600' as const,
    }),
    []
  );

  const screenOptions = useMemo(
    () => ({
      tabBarActiveTintColor: colors.highlight,
      tabBarInactiveTintColor: colors.secondaryText,
      tabBarStyle,
      headerShown: false,
      tabBarLabelStyle,
      animation: 'none' as const,
    }),
    [colors.highlight, colors.secondaryText, tabBarStyle, tabBarLabelStyle]
  );

  const todayIcon = useCallback(
    ({ color, size, focused }: { color: string; size: number; focused: boolean }) => (
      <AnimatedTabIcon focused={reduceMotion ? false : focused}>
        <Calendar size={size} color={color} />
      </AnimatedTabIcon>
    ),
    [reduceMotion]
  );

  const reviewIcon = useCallback(
    ({ color, size, focused }: { color: string; size: number; focused: boolean }) => (
      <AnimatedTabIcon focused={reduceMotion ? false : focused}>
        <ClipboardList size={size} color={color} />
      </AnimatedTabIcon>
    ),
    [reduceMotion]
  );

  const goalsIcon = useCallback(
    ({ color, size, focused }: { color: string; size: number; focused: boolean }) => (
      <AnimatedTabIcon focused={reduceMotion ? false : focused}>
        <Target size={size} color={color} />
      </AnimatedTabIcon>
    ),
    [reduceMotion]
  );

  const statsIcon = useCallback(
    ({ color, size, focused }: { color: string; size: number; focused: boolean }) => (
      <AnimatedTabIcon focused={reduceMotion ? false : focused}>
        <BarChart3 size={size} color={color} />
      </AnimatedTabIcon>
    ),
    [reduceMotion]
  );

  const settingsIcon = useCallback(
    ({ color, size, focused }: { color: string; size: number; focused: boolean }) => (
      <AnimatedTabIcon focused={reduceMotion ? false : focused}>
        <Settings size={size} color={color} />
      </AnimatedTabIcon>
    ),
    [reduceMotion]
  );

  const todayOptions = useMemo(() => ({ title: 'Today', tabBarIcon: todayIcon }), [todayIcon]);
  const reviewOptions = useMemo(() => ({ title: 'Review', tabBarIcon: reviewIcon }), [reviewIcon]);
  const goalsOptions = useMemo(() => ({ title: 'Goals', tabBarIcon: goalsIcon }), [goalsIcon]);
  const statsOptions = useMemo(() => ({ title: 'Stats', tabBarIcon: statsIcon }), [statsIcon]);
  const settingsOptions = useMemo(() => ({ title: 'Settings', tabBarIcon: settingsIcon }), [settingsIcon]);

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen name="(today)" options={todayOptions} />
      <Tabs.Screen name="review" options={reviewOptions} />
      <Tabs.Screen name="goals" options={goalsOptions} />
      <Tabs.Screen name="stats" options={statsOptions} />
      <Tabs.Screen name="settings" options={settingsOptions} />
    </Tabs>
  );
}

import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Tabs } from 'expo-router';
import { Calendar, BarChart3, Settings, ClipboardList, Target } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { Animated, Platform, AccessibilityInfo } from 'react-native';

const AnimatedTabIcon = React.memo(function AnimatedTabIcon({ children, focused }: { children: React.ReactNode; focused: boolean }) {
  const scale = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(focused ? 1 : 0.7)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: focused ? 1.15 : 1,
        friction: 8,
        tension: 140,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: focused ? -3 : 0,
        friction: 8,
        tension: 140,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: focused ? 1 : 0.7,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused, scale, translateY, opacity]);

  return (
    <Animated.View style={{ transform: [{ scale }, { translateY }], opacity }}>
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

  const tabBarStyle = useMemo(() => ({
    backgroundColor: colors.cardBackground,
    borderTopColor: colors.divider,
    borderTopWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  }), [colors.cardBackground, colors.divider]);

  const tabBarLabelStyle = useMemo(() => ({
    fontSize: 11,
    fontWeight: '600' as const,
  }), []);

  const screenOptions = useMemo(() => ({
  tabBarActiveTintColor: colors.highlight,
  tabBarInactiveTintColor: colors.secondaryText,
  tabBarStyle,
  headerShown: false,
  tabBarLabelStyle,
  animation: reduceMotion ? 'none' as const : 'fade' as const,
}), [colors.highlight, colors.secondaryText, tabBarStyle, tabBarLabelStyle, reduceMotion]);

  const todayIcon = useCallback(({ color, size, focused }: { color: string; size: number; focused: boolean }) => (
    <AnimatedTabIcon focused={focused}>
      <Calendar size={size} color={color} />
    </AnimatedTabIcon>
  ), []);

  const reviewIcon = useCallback(({ color, size, focused }: { color: string; size: number; focused: boolean }) => (
    <AnimatedTabIcon focused={focused}>
      <ClipboardList size={size} color={color} />
    </AnimatedTabIcon>
  ), []);

  const goalsIcon = useCallback(({ color, size, focused }: { color: string; size: number; focused: boolean }) => (
    <AnimatedTabIcon focused={focused}>
      <Target size={size} color={color} />
    </AnimatedTabIcon>
  ), []);

  const statsIcon = useCallback(({ color, size, focused }: { color: string; size: number; focused: boolean }) => (
    <AnimatedTabIcon focused={focused}>
      <BarChart3 size={size} color={color} />
    </AnimatedTabIcon>
  ), []);

  const settingsIcon = useCallback(({ color, size, focused }: { color: string; size: number; focused: boolean }) => (
    <AnimatedTabIcon focused={focused}>
      <Settings size={size} color={color} />
    </AnimatedTabIcon>
  ), []);

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

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useMemo, useRef } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DataProvider } from '../contexts/DataContext';
import { ActivitiesProvider } from '../contexts/ActivitiesContext';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { useNotifications } from '../hooks/useNotifications';
import { initializeRootNotificationListener, handleNotificationAction, NOTIFICATION_ACTION_TASK } from '../utils/notifications';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';

SplashScreen.preventAutoHideAsync();

if (Platform.OS !== 'web') {
  try {
    const TaskManager = require('expo-task-manager');
    TaskManager.defineTask(NOTIFICATION_ACTION_TASK, async ({ data, error }: { data: any; error: any }) => {
      if (error) {
        console.error('[BackgroundTask] NOTIFICATION_ACTION_TASK error:', error);
        return;
      }

      console.log('[BackgroundTask] NOTIFICATION_ACTION_TASK received:', JSON.stringify(data));

      const actionId = data?.actionIdentifier || '';
      const notificationData = data?.notification?.request?.content?.data as Record<string, unknown> | undefined;

      if (actionId && actionId !== 'expo.modules.notifications.actions.DEFAULT') {
        console.log(`[BackgroundTask] Processing action: ${actionId}`);
        await handleNotificationAction(actionId, notificationData);
      } else {
        console.log('[BackgroundTask] Default tap or no action, ignoring');
      }
    });
    console.log('[BackgroundTask] NOTIFICATION_ACTION_TASK defined at module level');
  } catch (e) {
    console.log('[BackgroundTask] Could not define task (expected on web):', e);
  }
}

const queryClient = new QueryClient();

function NotificationScheduler() {
  useNotifications();
  return null;
}

function ThemedApp() {
  const { colors, isDark } = useTheme();

  const navigationTheme = useMemo(() => isDark
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          background: colors.background,
          card: colors.cardBackground,
          text: colors.primaryText,
          border: colors.cardBorder,
          primary: colors.highlight,
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: colors.background,
          card: colors.cardBackground,
          text: colors.primaryText,
          border: colors.cardBorder,
          primary: colors.highlight,
        },
      }, [isDark, colors]);

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
        <NotificationScheduler />
        <Stack
          screenOptions={{
            headerBackTitle: 'Back',
            animation: 'slide_from_right',
            headerStyle: { backgroundColor: colors.cardBackground },
            headerTintColor: colors.primaryText,
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="modal"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }}
          />
          <Stack.Screen
            name="range-log"
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
              headerShown: false,
            }}
          />
        </Stack>
      </GestureHandlerRootView>
    </NavigationThemeProvider>
  );
}

function RootLayoutNav() {
  return (
    <ThemeProvider>
      <ThemedApp />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    console.log('[RootLayout] Initializing root notification listener & background task');
    initializeRootNotificationListener().then((cleanup) => {
      if (cleanup) {
        cleanupRef.current = cleanup;
        console.log('[RootLayout] Root notification listener initialized successfully');
      }
    });

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <DataProvider>
        <ActivitiesProvider>
          <RootLayoutNav />
        </ActivitiesProvider>
      </DataProvider>
    </QueryClientProvider>
  );
}

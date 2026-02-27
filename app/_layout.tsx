import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useMemo } from 'react';
import { GestureHandlerRootView, gestureHandlerRootHOC } from 'react-native-gesture-handler';
import { DataProvider } from '../contexts/DataContext';
import { ActivitiesProvider } from '../contexts/ActivitiesContext';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { useNotifications } from '../hooks/useNotifications';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function NotificationHandler() {
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
        <NotificationHandler />
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
  useEffect(() => {
    SplashScreen.hideAsync();
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

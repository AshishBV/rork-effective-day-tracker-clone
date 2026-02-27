import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useColorScheme, Platform } from 'react-native';
import * as Location from 'expo-location';
import SunCalc from 'suncalc';
import { ThemeMode } from '../types/data';
import { useData } from './DataContext';

export interface ThemeColors {
  background: string;
  cardBackground: string;
  cardBorder: string;
  primaryText: string;
  secondaryText: string;
  divider: string;
  gridLine: string;
  success: string;
  error: string;
  highlight: string;
  accentYellow: string;
  bannerBg: string;
}

const LIGHT_THEME: ThemeColors = {
  background: '#FFFFFF',
  cardBackground: '#FFFFFF',
  cardBorder: '#E6E6E6',
  primaryText: '#111111',
  secondaryText: '#666666',
  divider: '#EEEEEE',
  gridLine: '#EAEAEA',
  success: '#104911',
  error: '#720026',
  highlight: '#127475',
  accentYellow: '#FFE5A0',
  bannerBg: '#0B3C49',
};

const DARK_THEME: ThemeColors = {
  background: '#121212',
  cardBackground: '#1E1E1E',
  cardBorder: '#2C2C2C',
  primaryText: '#FFFFFF',
  secondaryText: '#A0A0A0',
  divider: '#2C2C2C',
  gridLine: '#333333',
  success: '#4CAF50',
  error: '#EF5350',
  highlight: '#26A69A',
  accentYellow: '#FFE5A0',
  bannerBg: '#1A3A4A',
};

export const [ThemeProvider, useTheme] = createContextHook(() => {
  const { settings, updateSettings } = useData();
  const systemColorScheme = useColorScheme();
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  
  const [nextSwitchTime, setNextSwitchTime] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [currentAutoTheme, setCurrentAutoTheme] = useState<'light' | 'dark'>('light');

  const themeMode = settings.themeMode || 'light';

  useEffect(() => {
    if (themeMode === 'auto') {
      requestLocationPermission();
    }
  }, [themeMode]);

  const requestLocationPermission = async () => {
    if (Platform.OS === 'web') {
      setLocationError('Location not available on web. Using System theme.');
      return;
    }

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission needed for Auto. Using System theme.');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      setLocationError(null);
    } catch (error) {
      console.log('Location error:', error);
      setLocationError('Could not get location. Using System theme.');
    }
  };

  useEffect(() => {
    if (themeMode === 'auto' && location) {
      const calculateSunTimes = () => {
        const now = new Date();
        const times = SunCalc.getTimes(now, location.latitude, location.longitude);
        const isDay = now >= times.sunrise && now < times.sunset;
        setCurrentAutoTheme(isDay ? 'light' : 'dark');

        const nextSwitch = isDay ? times.sunset : times.sunrise;
        let nextSwitchDate = nextSwitch;
        if (nextSwitch < now) {
          const tomorrow = new Date(now);
          tomorrow.setDate(tomorrow.getDate() + 1);
          const tomorrowTimes = SunCalc.getTimes(tomorrow, location.latitude, location.longitude);
          nextSwitchDate = isDay ? tomorrowTimes.sunset : tomorrowTimes.sunrise;
        }
        
        setNextSwitchTime(
          nextSwitchDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        );
      };

      calculateSunTimes();
      const interval = setInterval(calculateSunTimes, 60000);
      return () => clearInterval(interval);
    }
  }, [themeMode, location]);

  const resolvedTheme = useMemo((): 'light' | 'dark' => {
    switch (themeMode) {
      case 'light':
        return 'light';
      case 'dark':
        return 'dark';
      case 'system':
        return systemColorScheme === 'dark' ? 'dark' : 'light';
      case 'auto':
        if (locationError || !location) {
          return systemColorScheme === 'dark' ? 'dark' : 'light';
        }
        return currentAutoTheme;
      default:
        return 'light';
    }
  }, [themeMode, systemColorScheme, currentAutoTheme, locationError, location]);

  const colors = useMemo((): ThemeColors => {
    return resolvedTheme === 'dark' ? DARK_THEME : LIGHT_THEME;
  }, [resolvedTheme]);

  const isDark = resolvedTheme === 'dark';

  const setThemeMode = useCallback((mode: ThemeMode) => {
    updateSettings({ themeMode: mode });
  }, [updateSettings]);

  const autoStatus = useMemo(() => {
    if (themeMode !== 'auto') return null;
    if (locationError) return locationError;
    if (!location) return 'Getting location...';
    return `Currently: ${resolvedTheme === 'dark' ? 'Dark' : 'Light'} (next switch at ${nextSwitchTime})`;
  }, [themeMode, locationError, location, resolvedTheme, nextSwitchTime]);

  return {
    themeMode,
    setThemeMode,
    colors,
    isDark,
    autoStatus,
  };
});

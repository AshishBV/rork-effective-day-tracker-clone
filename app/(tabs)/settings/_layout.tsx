import { Stack } from 'expo-router';
import { useTheme } from '../../../contexts/ThemeContext';

export default function SettingsLayout() {
  const { colors } = useTheme();
  
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.cardBackground },
        headerTintColor: colors.primaryText,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Settings' }} />
      <Stack.Screen name="profile" options={{ title: 'Profile' }} />
      <Stack.Screen name="theme" options={{ title: 'Theme' }} />
      <Stack.Screen name="quote" options={{ title: 'Quote / Affirmation' }} />
      <Stack.Screen name="activities" options={{ title: 'Activities' }} />
      <Stack.Screen name="time" options={{ title: 'Time Settings' }} />
      <Stack.Screen name="goals" options={{ title: 'Goals' }} />
      <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
      <Stack.Screen name="habits" options={{ title: 'Manage Habits' }} />
      <Stack.Screen name="about" options={{ title: 'About' }} />
    </Stack>
  );
}

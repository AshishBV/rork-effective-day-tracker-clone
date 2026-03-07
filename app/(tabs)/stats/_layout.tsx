import { Stack } from 'expo-router';
import { useTheme } from '../../../contexts/ThemeContext';

export default function StatsLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.primaryText,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Statistics' }} />
      <Stack.Screen name="highlights" options={{ title: 'Monthly Highlights' }} />
    </Stack>
  );
}

import { Stack } from 'expo-router';
import { THEME } from '../../../constants/theme';

export default function StatsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: THEME.background },
        headerTintColor: THEME.primaryText,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Statistics' }} />
      <Stack.Screen name="highlights" options={{ title: 'Monthly Highlights' }} />
    </Stack>
  );
}

import { Stack } from 'expo-router';
import { THEME } from '../../../constants/theme';

export default function TodayLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: THEME.background },
        headerTintColor: THEME.primaryText,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}

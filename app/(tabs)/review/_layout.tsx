import { Stack } from 'expo-router';
import { useTheme } from '../../../contexts/ThemeContext';

export default function ReviewLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.primaryText,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Daily Review' }} />
    </Stack>
  );
}

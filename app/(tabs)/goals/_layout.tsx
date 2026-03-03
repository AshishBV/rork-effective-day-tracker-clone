import { Stack } from 'expo-router';

export default function GoalsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Goals' }} />
    </Stack>
  );
}

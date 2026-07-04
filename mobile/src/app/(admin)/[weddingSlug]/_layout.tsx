import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/lib/auth/AuthContext';

/**
 * Admin navigator: a stack whose base is the tab bar, with detail
 * screens (responses, details, travel, transportation) pushed above it.
 */
export default function AdminStackLayout() {
  const { user, loading } = useAuth();

  if (!loading && !user) return <Redirect href="/login" />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="responses" />
      <Stack.Screen name="details" />
      <Stack.Screen name="travel" />
      <Stack.Screen name="transportation" />
      <Stack.Screen name="rooms" />
      <Stack.Screen name="tasks" />
      <Stack.Screen name="messaging" />
      <Stack.Screen name="concierge" />
    </Stack>
  );
}

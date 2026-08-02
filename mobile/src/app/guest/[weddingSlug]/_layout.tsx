import { Stack } from 'expo-router';

/** Guest portal: a plain stack — access gating happens on the index screen. */
export default function GuestLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}

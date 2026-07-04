import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '@/lib/auth/AuthContext';
import { MOCK_WEDDING } from '@/lib/mock/wedding';
import { COLORS } from '@/lib/theme/tokens';

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg.paper }}>
        <ActivityIndicator color={COLORS.brand.primary} />
      </View>
    );
  }

  if (!user) return <Redirect href="/login" />;

  // TODO(Phase 1): wedding switcher — look up the user's weddings and route.
  // Preview mode has exactly one mock wedding.
  return <Redirect href={`/${MOCK_WEDDING.slug}/overview`} />;
}

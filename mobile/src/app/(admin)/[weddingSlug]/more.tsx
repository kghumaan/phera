import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { Screen } from '@/components/Screen';
import { PageHeading, PheraButton, PheraCard, PheraText } from '@/components/ui';
import { useAuth } from '@/lib/auth/AuthContext';
import { COLORS } from '@/lib/theme/tokens';

const ITEMS = [
  { icon: 'airplane-outline', label: 'Travel', hint: 'Phase 3' },
  { icon: 'bus-outline', label: 'Transportation', hint: 'Phase 3' },
  { icon: 'bed-outline', label: 'Room assignments', hint: 'Phase 3' },
  { icon: 'chatbubbles-outline', label: 'Messaging', hint: 'Phase 4' },
  { icon: 'headset-outline', label: 'Concierge', hint: 'Phase 4' },
  { icon: 'settings-outline', label: 'Settings', hint: 'Phase 6' },
] as const;

export default function MoreScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  return (
    <Screen>
      <PageHeading title="More" subtitle={user?.email ?? ''} />

      <View style={{ gap: 10 }}>
        {ITEMS.map((item) => (
          <PheraCard key={item.label}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Ionicons name={item.icon} size={20} color={COLORS.text.muted} />
              <PheraText variant="body" weight={500} style={{ flex: 1 }}>
                {item.label}
              </PheraText>
              <PheraText variant="body2" color={COLORS.text.faint}>
                {item.hint}
              </PheraText>
            </View>
          </PheraCard>
        ))}
      </View>

      {__DEV__ ? (
        <PheraButton variant="secondary" fullWidth onPress={() => router.push('/gallery')}>
          Design gallery (dev)
        </PheraButton>
      ) : null}

      <PheraButton
        variant="ghost"
        fullWidth
        onPress={async () => {
          await signOut();
          router.replace('/login');
        }}
      >
        Sign out
      </PheraButton>
    </Screen>
  );
}

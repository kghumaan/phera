import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { Screen } from '@/components/Screen';
import { PageHeading, PheraButton, PheraCard, PheraText } from '@/components/ui';
import { useAuth } from '@/lib/auth/AuthContext';
import { COLORS } from '@/lib/theme/tokens';
import { useWeddingSlug } from '@/lib/nav';

type Item = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  route?: 'details' | 'travel' | 'transportation' | 'rooms' | 'tasks' | 'messaging' | 'concierge' | 'settings';
  hint?: string;
};

const ITEMS: Item[] = [
  { icon: 'information-circle-outline', label: 'Wedding details', route: 'details' },
  { icon: 'airplane-outline', label: 'Travel', route: 'travel' },
  { icon: 'bus-outline', label: 'Transportation', route: 'transportation' },
  { icon: 'bed-outline', label: 'Room assignments', route: 'rooms' },
  { icon: 'checkbox-outline', label: 'Tasks', route: 'tasks' },
  { icon: 'chatbubbles-outline', label: 'Messaging', route: 'messaging' },
  { icon: 'headset-outline', label: 'Concierge', route: 'concierge' },
  { icon: 'settings-outline', label: 'Settings', route: 'settings' },
];

export default function MoreScreen() {
  const weddingSlug = useWeddingSlug();
  const router = useRouter();
  const { user, signOut } = useAuth();

  return (
    <Screen>
      <PageHeading title="More" subtitle={user?.email ?? ''} />

      <View style={{ gap: 10 }}>
        {ITEMS.map((item) => (
          <PheraCard
            key={item.label}
            accessibilityLabel={item.route ? `Open ${item.label}` : undefined}
            onPress={item.route ? () => router.push(`/${weddingSlug}/${item.route}` as never) : undefined}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Ionicons name={item.icon} size={20} color={COLORS.text.muted} />
              <PheraText variant="body" weight={500} style={{ flex: 1 }}>
                {item.label}
              </PheraText>
              {item.route ? (
                <Ionicons name="chevron-forward" size={18} color={COLORS.text.faint} />
              ) : (
                <PheraText variant="body2" color={COLORS.text.faint}>
                  {item.hint}
                </PheraText>
              )}
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

import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Share, View } from 'react-native';

import { Screen } from '@/components/Screen';
import { PageHeading, PheraButton, PheraCard, PheraChip, PheraText, SectionHeading } from '@/components/ui';
import { useAuth } from '@/lib/auth/AuthContext';
import { useSettings, useWedding } from '@/lib/data/hooks';
import { COLORS } from '@/lib/theme/tokens';
import { useWeddingSlug } from '@/lib/nav';

function InfoRow({
  icon,
  label,
  value,
  action,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  action?: React.ReactNode;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Ionicons name={icon} size={20} color={COLORS.text.muted} />
      <View style={{ flex: 1 }}>
        <PheraText variant="body2" color={COLORS.text.subtle}>
          {label}
        </PheraText>
        <PheraText variant="body" weight={500}>
          {value}
        </PheraText>
      </View>
      {action}
    </View>
  );
}

export default function SettingsScreen() {
  const weddingSlug = useWeddingSlug();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const wedding = useWedding(weddingSlug);
  const settings = useSettings(wedding.data?.id);

  const [showPassword, setShowPassword] = useState(false);
  const guestUrl = `https://phera.io/${weddingSlug}`;
  const isLive = wedding.data?.status === 'live';

  return (
    <Screen onRefresh={() => settings.refetch()} refreshing={settings.isRefetching}>
      <PageHeading
        title="Settings"
        subtitle="Your wedding's access & status"
        action={
          <Ionicons name="close" size={24} color={COLORS.text.muted} onPress={() => router.back()} />
        }
      />

      <View style={{ gap: 12 }}>
        <SectionHeading title="Guest access" />
        <PheraCard>
          <View style={{ gap: 18 }}>
            <InfoRow
              icon="link-outline"
              label="Guest site"
              value={guestUrl.replace('https://', '')}
              action={
                <Pressable
                  accessibilityLabel="Share guest link"
                  hitSlop={8}
                  onPress={() => void Share.share({ message: guestUrl })}
                >
                  <Ionicons name="share-outline" size={20} color={COLORS.brand.primary} />
                </Pressable>
              }
            />
            <InfoRow
              icon="key-outline"
              label="Wedding password"
              value={
                settings.data?.wedding_password
                  ? showPassword
                    ? settings.data.wedding_password
                    : '••••••••'
                  : 'Not set'
              }
              action={
                settings.data?.wedding_password ? (
                  <Pressable
                    accessibilityLabel="Toggle password visibility"
                    hitSlop={8}
                    onPress={() => setShowPassword((v) => !v)}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={COLORS.text.muted}
                    />
                  </Pressable>
                ) : undefined
              }
            />
          </View>
        </PheraCard>
      </View>

      <View style={{ gap: 12 }}>
        <SectionHeading title="Status" />
        <PheraCard>
          <View style={{ gap: 18 }}>
            <InfoRow
              icon="globe-outline"
              label="Guest site status"
              value={isLive ? 'Published' : 'Draft'}
              action={<PheraChip label={isLive ? 'Live' : 'Draft'} tone={isLive ? 'success' : 'warning'} />}
            />
            <InfoRow
              icon="headset-outline"
              label="WhatsApp concierge"
              value={settings.data?.concierge_enabled ? 'Answering guests' : 'Off'}
              action={
                <PheraChip
                  label={settings.data?.concierge_enabled ? 'Active' : 'Off'}
                  tone={settings.data?.concierge_enabled ? 'success' : 'neutral'}
                />
              }
            />
          </View>
        </PheraCard>
        <PheraText variant="body2" color={COLORS.text.faint}>
          Publishing, look & feel, and password changes happen on the web app — or ask the Planner.
        </PheraText>
      </View>

      <View style={{ gap: 12 }}>
        <SectionHeading title="Account" />
        <PheraCard>
          <InfoRow icon="person-outline" label="Signed in as" value={user?.email ?? '—'} />
        </PheraCard>
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
        <PheraText variant="body2" align="center" color={COLORS.text.faint}>
          Phera {Constants.expoConfig?.version ?? '0.1.0'}
        </PheraText>
      </View>
    </Screen>
  );
}

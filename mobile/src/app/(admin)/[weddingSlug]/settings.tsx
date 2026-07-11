import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Share, View } from 'react-native';

import { Screen } from '@/components/Screen';
import {
  PageHeading,
  PheraButton,
  PheraCard,
  PheraChip,
  PheraInput,
  PheraText,
  SectionHeading,
  SuccessAlert,
} from '@/components/ui';
import { useAuth } from '@/lib/auth/AuthContext';
import {
  useSettings,
  useUpdateIntegrations,
  useUpdateWeddingStatus,
  useWedding,
} from '@/lib/data/hooks';
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

function ChecklistRow({ done, label }: { done: boolean; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Ionicons
        name={done ? 'checkmark-circle' : 'close-circle'}
        size={18}
        color={done ? COLORS.accent.success : COLORS.accent.danger}
      />
      <PheraText variant="body2" style={{ flex: 1 }}>
        {label}
      </PheraText>
    </View>
  );
}

/** Web "Settings & Publish" parity: publish control, website links,
 *  integrations, pre-publish checklist — plus the mobile guest-access
 *  extras (share link, password reveal) and account section. */
export default function SettingsScreen() {
  const weddingSlug = useWeddingSlug();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const wedding = useWedding(weddingSlug);
  const settings = useSettings(wedding.data?.id);
  const updateStatus = useUpdateWeddingStatus(weddingSlug);
  const updateIntegrations = useUpdateIntegrations(wedding.data?.id);

  const [showPassword, setShowPassword] = useState(false);
  const [confirmingPublish, setConfirmingPublish] = useState(false);
  const [waLink, setWaLink] = useState('');
  const [sheetsId, setSheetsId] = useState('');
  const [savedNote, setSavedNote] = useState(false);

  useEffect(() => {
    if (settings.data) {
      setWaLink(settings.data.whatsapp_group_link ?? '');
      setSheetsId(settings.data.google_sheets_id ?? '');
    }
  }, [settings.data]);

  const guestUrl = `https://phera.io/${weddingSlug}`;
  const isLive = wedding.data?.status === 'live';
  const pinCount = settings.data?.pin_codes?.length ?? 0;

  const togglePublish = async () => {
    if (!wedding.data) return;
    await updateStatus.mutateAsync({
      weddingId: wedding.data.id,
      status: isLive ? 'draft' : 'live',
    });
    setConfirmingPublish(false);
  };

  return (
    <Screen onRefresh={() => Promise.all([settings.refetch(), wedding.refetch()])} refreshing={settings.isRefetching}>
      <PageHeading
        title="Settings & Publish"
        subtitle="Manage your wedding website settings and publish when ready"
        action={
          <Ionicons name="close" size={24} color={COLORS.text.muted} onPress={() => router.back()} />
        }
      />

      <View style={{ gap: 12 }}>
        <SectionHeading title="Publish Control" />
        <PheraCard>
          <View style={{ gap: 14 }}>
            <InfoRow
              icon="globe-outline"
              label="Website status"
              value={
                isLive ? 'Your wedding website is live' : 'Your wedding website is in draft mode'
              }
              action={<PheraChip label={isLive ? 'LIVE' : 'DRAFT'} tone={isLive ? 'success' : 'warning'} />}
            />
            {confirmingPublish ? (
              <View style={{ gap: 10 }}>
                <PheraText variant="body2">
                  {isLive
                    ? 'Your wedding website will no longer be accessible to guests.'
                    : 'Are you sure you want to publish your wedding website? It will be visible to all guests with PINs.'}
                </PheraText>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <PheraButton variant="secondary" style={{ flex: 1 }} onPress={() => setConfirmingPublish(false)}>
                    Cancel
                  </PheraButton>
                  <PheraButton
                    style={{ flex: 1 }}
                    loading={updateStatus.isPending}
                    onPress={() => void togglePublish()}
                    testID="publish-confirm"
                  >
                    {isLive ? 'Deactivate' : 'Publish'}
                  </PheraButton>
                </View>
              </View>
            ) : (
              <PheraButton fullWidth onPress={() => setConfirmingPublish(true)} testID="publish-toggle">
                {isLive ? 'Deactivate Website' : 'Publish Website'}
              </PheraButton>
            )}
          </View>
        </PheraCard>
      </View>

      <View style={{ gap: 12 }}>
        <SectionHeading title="Website Links" />
        <PheraCard>
          <View style={{ gap: 18 }}>
            <InfoRow
              icon="link-outline"
              label="Your Wedding URL"
              value={guestUrl.replace('https://', '')}
              action={
                <View style={{ flexDirection: 'row', gap: 14 }}>
                  <Pressable
                    accessibilityLabel="Share guest link"
                    hitSlop={8}
                    onPress={() => void Share.share({ message: guestUrl })}
                  >
                    <Ionicons name="share-outline" size={20} color={COLORS.brand.primary} />
                  </Pressable>
                  <Pressable
                    accessibilityLabel="Open guest site"
                    hitSlop={8}
                    onPress={() => void Linking.openURL(guestUrl)}
                  >
                    <Ionicons name="open-outline" size={20} color={COLORS.brand.primary} />
                  </Pressable>
                </View>
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
        <SectionHeading title="Integrations" />
        {savedNote ? <SuccessAlert onClose={() => setSavedNote(false)}>Saved</SuccessAlert> : null}
        <PheraCard>
          <View style={{ gap: 14 }}>
            <PheraInput
              label="WhatsApp Group Link"
              value={waLink}
              onChangeText={setWaLink}
              placeholder="https://chat.whatsapp.com/..."
              autoCapitalize="none"
            />
            <PheraInput
              label="Google Sheets ID"
              value={sheetsId}
              onChangeText={setSheetsId}
              placeholder="1ABC..."
              autoCapitalize="none"
            />
            <PheraButton
              variant="secondary"
              fullWidth
              loading={updateIntegrations.isPending}
              onPress={async () => {
                await updateIntegrations.mutateAsync({ whatsappGroupLink: waLink, googleSheetsId: sheetsId });
                setSavedNote(true);
              }}
            >
              Save integrations
            </PheraButton>
          </View>
        </PheraCard>
      </View>

      <View style={{ gap: 12 }}>
        <SectionHeading title="Pre-Publish Checklist" />
        <PheraCard>
          <View style={{ gap: 10 }}>
            <ChecklistRow done label="Wedding overview completed" />
            <ChecklistRow done label="At least one event added" />
            <ChecklistRow done label="Schedule configured" />
            <ChecklistRow
              done={pinCount > 0}
              label={
                pinCount > 0
                  ? `Guest PIN codes added (${pinCount})`
                  : 'Add at least one PIN code for guests'
              }
            />
          </View>
        </PheraCard>
        <PheraText variant="body2" color={COLORS.text.faint}>
          Look & feel and password changes happen on the web app — or ask the Planner.
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

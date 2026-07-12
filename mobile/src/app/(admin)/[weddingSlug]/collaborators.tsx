import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Screen } from '@/components/Screen';
import {
  EmptyState,
  PageHeading,
  PheraButton,
  PheraCard,
  PheraChip,
  PheraInput,
  PheraText,
  SuccessAlert,
  WarningAlert,
  type PheraChipTone,
} from '@/components/ui';
import { useAuth } from '@/lib/auth/AuthContext';
import { useCancelInvite, useCollaborators, useSendInvite, useWedding } from '@/lib/data/hooks';
import { COLORS, RADII } from '@/lib/theme/tokens';
import { useWeddingSlug } from '@/lib/nav';

const ROLE_TONE: Record<string, PheraChipTone> = {
  owner: 'brand',
  admin: 'info',
  viewer: 'neutral',
};

// Web TeamPage role labels.
const ROLE_LABEL: Record<string, string> = {
  owner: 'Owner',
  admin: 'Can Edit',
  viewer: 'View Only',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function CollaboratorsScreen() {
  const weddingSlug = useWeddingSlug();
  const router = useRouter();
  const { user } = useAuth();
  const wedding = useWedding(weddingSlug);
  const collaborators = useCollaborators(wedding.data?.id, wedding.data?.created_by);
  const sendInvite = useSendInvite(wedding.data?.id);
  const cancelInvite = useCancelInvite(wedding.data?.id);

  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'viewer'>('admin');
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const list = collaborators.data ?? [];
  const isOwner = !!user && user.id === wedding.data?.created_by;

  const submitInvite = async () => {
    setError(null);
    setNotice(null);
    const clean = email.trim().toLowerCase();
    if (!EMAIL_RE.test(clean)) return setError('Enter a valid email address');
    if (list.some((c) => c.email.toLowerCase() === clean))
      return setError('They already have access (or a pending invite)');
    try {
      await sendInvite.mutateAsync({ email: clean, role });
      setNotice(`Invite sent to ${clean}`);
      setEmail('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send the invite — try again');
    }
  };

  return (
    <Screen onRefresh={() => collaborators.refetch()} refreshing={collaborators.isRefetching}>
      <PageHeading
        title="Collaborators"
        subtitle="Manage who can access and edit your wedding website"
        action={
          <Ionicons name="close" size={24} color={COLORS.text.muted} onPress={() => router.back()} />
        }
      />

      {isOwner ? (
        <PheraCard>
          <View style={{ gap: 12 }}>
            {notice ? <SuccessAlert onClose={() => setNotice(null)}>{notice}</SuccessAlert> : null}
            {error ? <WarningAlert onClose={() => setError(null)}>{error}</WarningAlert> : null}
            <PheraInput
              label="Invite by email"
              value={email}
              onChangeText={setEmail}
              placeholder="planner@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              testID="invite-email"
            />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {(['admin', 'viewer'] as const).map((r) => (
                <Pressable
                  key={r}
                  accessibilityRole="button"
                  onPress={() => setRole(r)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: RADII.pill,
                    borderWidth: 1.5,
                    borderColor: role === r ? COLORS.brand.primary : COLORS.border.default,
                    backgroundColor: role === r ? COLORS.brand.primarySubtle : COLORS.bg.white,
                  }}
                >
                  <PheraText
                    variant="body2"
                    weight={500}
                    color={role === r ? COLORS.brand.primary : COLORS.text.muted}
                  >
                    {ROLE_LABEL[r]}
                  </PheraText>
                </Pressable>
              ))}
            </View>
            <PheraButton fullWidth loading={sendInvite.isPending} onPress={() => void submitInvite()} testID="invite-send">
              Send Invite
            </PheraButton>
          </View>
        </PheraCard>
      ) : null}

      {list.length === 0 ? (
        <EmptyState
          icon="people-outline"
          title="Just you so far"
          subtitle="Invite family or your planner from the web app — they appear here."
        />
      ) : (
        list.map((c) => (
          <PheraCard key={c.id}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 999,
                  backgroundColor: COLORS.brand.primarySubtle,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons
                  name={c.pending ? 'mail-outline' : 'person-outline'}
                  size={18}
                  color={COLORS.brand.primary}
                />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <PheraText variant="body" weight={500}>
                  {c.email}
                </PheraText>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <PheraChip label={ROLE_LABEL[c.role] ?? c.role} tone={ROLE_TONE[c.role] ?? 'neutral'} />
                  {c.pending ? <PheraChip label="Invite pending" tone="warning" /> : null}
                </View>
              </View>
              {c.pending && isOwner ? (
                <Pressable
                  accessibilityLabel={`Cancel invite for ${c.email}`}
                  hitSlop={8}
                  onPress={() => void cancelInvite.mutateAsync(c.id)}
                >
                  <Ionicons name="trash-outline" size={18} color={COLORS.text.faint} />
                </Pressable>
              ) : null}
            </View>
          </PheraCard>
        ))
      )}

      <PheraText variant="body2" color={COLORS.text.faint} align="center">
        Owner has full control · Can Edit manages content · View Only sees everything read-only.
      </PheraText>
    </Screen>
  );
}

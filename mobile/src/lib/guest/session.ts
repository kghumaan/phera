import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Guest session — mirrors the web's localStorage contract
 * (components/guest/PinEntry.tsx): password flag with 24h TTL plus the
 * picked guest id. Keys match web names so mental model stays shared.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

export interface GuestSession {
  guestId: string;
  guestName: string;
}

const keys = (slug: string) => ({
  passwordOk: `phera_password_ok_${slug}`,
  passwordTs: `phera_password_ts_${slug}`,
  guestId: `phera_guest_id_${slug}`,
  guestName: `phera_guest_name_${slug}`,
});

export async function getGuestSession(slug: string): Promise<GuestSession | null> {
  const k = keys(slug);
  const [ok, ts, guestId, guestName] = await Promise.all([
    AsyncStorage.getItem(k.passwordOk),
    AsyncStorage.getItem(k.passwordTs),
    AsyncStorage.getItem(k.guestId),
    AsyncStorage.getItem(k.guestName),
  ]);
  if (ok !== 'true' || !guestId) return null;
  if (ts && Date.now() - Number(ts) > DAY_MS) return null; // 24h TTL, like web
  return { guestId, guestName: guestName ?? 'Guest' };
}

export async function setGuestSession(slug: string, session: GuestSession): Promise<void> {
  const k = keys(slug);
  await Promise.all([
    AsyncStorage.setItem(k.passwordOk, 'true'),
    AsyncStorage.setItem(k.passwordTs, String(Date.now())),
    AsyncStorage.setItem(k.guestId, session.guestId),
    AsyncStorage.setItem(k.guestName, session.guestName),
  ]);
}

export async function clearGuestSession(slug: string): Promise<void> {
  const k = keys(slug);
  await AsyncStorage.multiRemove([k.passwordOk, k.passwordTs, k.guestId, k.guestName]);
}

import { describe, it, expect, beforeEach } from 'vitest';

/**
 * The new access flow replaces the 4-digit PIN storage with three
 * wedding-scoped keys. This test pins down the expected state transitions
 * the PinEntry / AccessFlow orchestrator relies on for:
 *   - 24h expiry
 *   - resuming at the name step when password was verified but no guest
 *     has been picked
 *   - full bypass when both password and guest id are present
 */

const TTL_MS = 24 * 60 * 60 * 1000;

function readRecentFlag(slug: string, key: string, tsKey: string): string | null {
  const val = localStorage.getItem(`${key}_${slug}`);
  const ts = localStorage.getItem(`${tsKey}_${slug}`);
  if (!val || !ts) return null;
  if (Date.now() - parseInt(ts, 10) > TTL_MS) return null;
  return val;
}

function resolveStep(slug: string): 'password' | 'name' | 'bypass' {
  const guestId = readRecentFlag(slug, 'phera_guest_id', 'phera_password_ts');
  if (guestId) return 'bypass';
  const pwOk = readRecentFlag(slug, 'phera_password_ok', 'phera_password_ts');
  if (pwOk === 'true') return 'name';
  return 'password';
}

describe('access flow localStorage step resolution', () => {
  const slug = 'priya-rahul-2026';

  beforeEach(() => {
    localStorage.clear();
  });

  it('starts at the password step when nothing is stored', () => {
    expect(resolveStep(slug)).toBe('password');
  });

  it('resumes at the name step after password is verified but no guest picked', () => {
    localStorage.setItem(`phera_password_ok_${slug}`, 'true');
    localStorage.setItem(`phera_password_ts_${slug}`, Date.now().toString());
    expect(resolveStep(slug)).toBe('name');
  });

  it('bypasses both steps when guest_id + fresh timestamp are present', () => {
    localStorage.setItem(`phera_guest_id_${slug}`, 'guest-uuid-123');
    localStorage.setItem(`phera_password_ok_${slug}`, 'true');
    localStorage.setItem(`phera_password_ts_${slug}`, Date.now().toString());
    expect(resolveStep(slug)).toBe('bypass');
  });

  it('returns to password when the timestamp is older than 24h', () => {
    const stale = Date.now() - TTL_MS - 1000;
    localStorage.setItem(`phera_guest_id_${slug}`, 'guest-uuid-123');
    localStorage.setItem(`phera_password_ok_${slug}`, 'true');
    localStorage.setItem(`phera_password_ts_${slug}`, stale.toString());
    expect(resolveStep(slug)).toBe('password');
  });

  it('scopes flags per wedding slug', () => {
    localStorage.setItem(`phera_password_ok_wedding-a`, 'true');
    localStorage.setItem(`phera_password_ts_wedding-a`, Date.now().toString());
    expect(resolveStep('wedding-a')).toBe('name');
    expect(resolveStep('wedding-b')).toBe('password');
  });
});

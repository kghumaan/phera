import { getOpsCookieSecret, OPS_SESSION_MAX_AGE_SECONDS } from './constants';

// Signed session cookie value: `<expiresAtMs>.<hex hmac>`.
// HMAC covers `<expiresAtMs>` so we can verify + expire without DB lookup.
// Uses Web Crypto (SubtleCrypto) so it runs in both Edge middleware and Node route handlers.

const encoder = new TextEncoder();

async function getKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(getOpsCookieSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

function toHex(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let out = '';
  for (let i = 0; i < bytes.length; i += 1) {
    out += bytes[i].toString(16).padStart(2, '0');
  }
  return out;
}

async function hmacHex(data: string): Promise<string> {
  const key = await getKey();
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return toHex(sig);
}

export async function signOpsSession(now = Date.now()): Promise<string> {
  const exp = now + OPS_SESSION_MAX_AGE_SECONDS * 1000;
  const mac = await hmacHex(String(exp));
  return `${exp}.${mac}`;
}

export async function verifyOpsSession(
  value: string | undefined | null,
  now = Date.now(),
): Promise<boolean> {
  if (!value) return false;
  const parts = value.split('.');
  if (parts.length !== 2) return false;
  const [expStr, mac] = parts;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < now) return false;

  const expected = await hmacHex(expStr);
  if (expected.length !== mac.length) return false;
  // Constant-time-ish string compare.
  let diff = 0;
  for (let i = 0; i < expected.length; i += 1) {
    diff |= expected.charCodeAt(i) ^ mac.charCodeAt(i);
  }
  return diff === 0;
}

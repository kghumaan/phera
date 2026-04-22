import { NextResponse } from 'next/server';
import { OPS_COOKIE_NAME } from '@/lib/ops/constants';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(OPS_COOKIE_NAME, '', { path: '/', maxAge: 0 });
  return res;
}

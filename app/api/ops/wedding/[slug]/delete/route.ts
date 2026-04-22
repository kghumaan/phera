import { NextRequest, NextResponse } from 'next/server';
import { deleteWedding } from '@/lib/ops/wedding-delete';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  let body: { confirmSlug?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  if (!body.confirmSlug || body.confirmSlug !== slug) {
    return NextResponse.json(
      { error: 'confirmSlug must exactly match URL slug' },
      { status: 400 },
    );
  }

  const result = await deleteWedding(slug);
  const totalDeleted = result.deleted.reduce((a, r) => a + r.deleted, 0);
  const errors = result.deleted.filter((r) => r.error);

  return NextResponse.json({
    ok: errors.length === 0,
    slug,
    weddingId: result.weddingId,
    totalDeleted,
    deleted: result.deleted,
    errors,
  });
}

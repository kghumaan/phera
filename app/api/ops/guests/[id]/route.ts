import { NextResponse } from 'next/server';
import { deleteGuest, previewGuestDelete } from '@/lib/ops/guest-delete';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return NextResponse.json(await previewGuestDelete(id));
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const result = await deleteGuest(id);
  const totalDeleted = result.deleted.reduce((a, r) => a + r.deleted, 0);
  const errors = result.deleted.filter((r) => r.error);
  return NextResponse.json({
    ok: errors.length === 0,
    guestId: id,
    totalDeleted,
    deleted: result.deleted,
    errors,
  });
}

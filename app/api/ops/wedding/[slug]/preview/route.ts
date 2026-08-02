import { NextResponse } from 'next/server';
import { previewWeddingDelete } from '@/lib/ops/wedding-delete';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const result = await previewWeddingDelete(slug);
  return NextResponse.json(result);
}

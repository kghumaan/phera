import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

async function makeSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    },
  )
}

// GET /api/vendors/saved?wedding_id=slug
// Returns array of saved vendor_ids for fast client-side lookup
export async function GET(req: NextRequest) {
  const weddingId = req.nextUrl.searchParams.get('wedding_id')
  if (!weddingId) return NextResponse.json({ error: 'wedding_id required' }, { status: 400 })

  const supabase = await makeSupabase()
  const { data, error } = await supabase
    .from('saved_vendors')
    .select('vendor_id, notes, saved_at')
    .eq('wedding_id', weddingId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ saved: data ?? [] })
}

// POST /api/vendors/saved  body: { wedding_id, vendor_id, notes? }
export async function POST(req: NextRequest) {
  const { wedding_id, vendor_id, notes } = await req.json()
  if (!wedding_id || !vendor_id) {
    return NextResponse.json({ error: 'wedding_id and vendor_id required' }, { status: 400 })
  }

  const supabase = await makeSupabase()
  const { error } = await supabase
    .from('saved_vendors')
    .upsert({ wedding_id, vendor_id, notes: notes ?? null }, { onConflict: 'wedding_id,vendor_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// DELETE /api/vendors/saved  body: { wedding_id, vendor_id }
export async function DELETE(req: NextRequest) {
  const { wedding_id, vendor_id } = await req.json()
  if (!wedding_id || !vendor_id) {
    return NextResponse.json({ error: 'wedding_id and vendor_id required' }, { status: 400 })
  }

  const supabase = await makeSupabase()
  const { error } = await supabase
    .from('saved_vendors')
    .delete()
    .eq('wedding_id', wedding_id)
    .eq('vendor_id', vendor_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

import { NextRequest, NextResponse } from 'next/server';
import { handleFlowResponse, FlowResponseData } from '@/lib/whatsapp/flows';
import { getAuthenticatedClient } from '@/lib/utils/auth-helpers';

/**
 * NOTE: no internal callers today. Real Meta Flow completions arrive via the
 * signature-verified webhook. Auth-gated so it can't be used to forge RSVP
 * data for arbitrary guests; candidate for deletion.
 */
export async function POST(request: NextRequest) {
  try {
    const { user } = await getAuthenticatedClient();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { flow_data, guest_id, wedding_id } = body;

    if (!flow_data || !guest_id || !wedding_id) {
      return NextResponse.json(
        { error: 'flow_data, guest_id, and wedding_id are required' },
        { status: 400 }
      );
    }

    const flowData: FlowResponseData = flow_data;
    await handleFlowResponse(flowData, guest_id, wedding_id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Flow response error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

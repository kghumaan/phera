import { NextRequest, NextResponse } from 'next/server';
import { handleFlowResponse, FlowResponseData } from '@/lib/whatsapp/flows';

export async function POST(request: NextRequest) {
  try {
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

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendContactAlert } from '@/lib/email/alerts';

export async function POST(req: NextRequest) {
    try {
        const data = await req.json();
        const { name, email, phone, message } = data;

        if (!name || !email || !message) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Use service role to ensure bypass of RLS for public submission
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 1. Save to database
        const { error: dbError } = await supabase
            .from('contact_submissions')
            .insert([{ name, email, phone, message }]);

        if (dbError) {
            console.error('Failed to save contact submission to DB:', dbError);
            throw dbError;
        }

        // 2. Send email alert
        const emailResult = await sendContactAlert({ name, email, phone, message });

        if (!emailResult.success) {
            console.warn('Contact alert email failed to send, but record was saved:', emailResult.error);
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('API Error (Contact Submit):', error);
        return NextResponse.json({
            error: 'Submission failed',
            details: error.message
        }, { status: 500 });
    }
}

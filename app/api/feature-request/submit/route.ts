import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendFeatureRequestAlert } from '@/lib/email/alerts';
import { checkRateLimit } from '@/lib/utils/rate-limiter';

export async function POST(req: NextRequest) {
    const rateLimited = checkRateLimit(req, { maxRequests: 10, windowMs: 60_000, keyPrefix: 'feature-request' });
    if (rateLimited) return rateLimited;

    try {
        const data = await req.json();
        const { userId, weddingId, content, userEmail } = data;

        if (!content) {
            return NextResponse.json({ error: 'Missing content' }, { status: 400 });
        }

        // Use service role to ensure bypass of RLS
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 1. Save to database
        const { error: dbError } = await supabase
            .from('feature_requests')
            .insert([{
                user_id: userId || null,
                wedding_id: weddingId || null,
                content
            }]);

        if (dbError) {
            console.error('Failed to save feature request to DB:', dbError);
            throw dbError;
        }

        // 2. Send email alert
        const emailResult = await sendFeatureRequestAlert({
            userEmail: userEmail || 'Unknown',
            content,
            weddingId
        });

        if (!emailResult.success) {
            console.warn('Feature request email failed to send, but record was saved:', emailResult.error);
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('API Error (Feature Request Submit):', error);
        return NextResponse.json({
            error: 'Submission failed',
            details: error.message
        }, { status: 500 });
    }
}

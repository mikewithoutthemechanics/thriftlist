import { NextRequest, NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase-server';
import { runAutomation } from '@/lib/automation';
import { automationJobSchema } from '@/lib/validation';
import { checkRateLimit, getIdentifier } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const identifier = getIdentifier(request);
    const rateLimit = await checkRateLimit(identifier, { maxRequests: 10, windowMs: 60000 });
    
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many requests', retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000) },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.resetTime.toString(),
          }
        }
      );
    }

    const supabase = await createClientServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const validatedData = automationJobSchema.parse(body);
    const { itemId, platforms } = validatedData;

    // Create job record in the new robust queue
    const { data: job, error: jobError } = await supabase.from('automation_queue').insert({
      user_id: user.id,
      item_id: itemId,
      platforms,
      status: 'pending',
    }).select().single();

    if (jobError) throw jobError;

    // We no longer run in background promise to avoid Vercel timeouts.
    // The cron job (or a future Edge Function webhook) will pick it up.

    return NextResponse.json({ 
      success: true, 
      jobId: job.id, 
      message: 'Job queued for processing. You can check the status in the dashboard.' 
    });
  } catch (error: any) {
    console.error('POST /api/automation error:', error);
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to start automation' }, { status: 500 });
  }
}

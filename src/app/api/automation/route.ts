import { NextRequest, NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase-server';
import { runAutomation } from '@/lib/automation';
import { automationJobSchema } from '@/lib/validation';
import { checkRateLimit, getIdentifier } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const identifier = getIdentifier(request);
    const rateLimit = checkRateLimit(identifier, { maxRequests: 10, windowMs: 60000 });
    
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

    // Create job record for tracking
    const { data: job } = await supabase.from('automation_jobs').insert({
      user_id: user.id,
      item_id: itemId,
      platforms,
      status: 'queued',
    }).select().single();

    // Automation only works locally where Playwright + Chromium are installed
    // On Vercel/serverless, this will fail gracefully
    try {
      runAutomation({ itemId, platforms, userId: user.id })
        .then(async () => {
          // Update job status to completed
          await supabase.from('automation_jobs').update({ status: 'completed' }).eq('id', job.id);
        })
        .catch(async (err) => {
          console.error('Background automation error:', err);
          // Update job and all pending postings to failed
          await supabase.from('automation_jobs').update({ status: 'failed', error: err.message }).eq('id', job.id);
          await supabase.from('postings').update({ status: 'failed', error: err.message })
            .eq('item_id', itemId).eq('user_id', user.id).eq('status', 'pending');
        });
    } catch (err: any) {
      console.error('Automation startup error:', err);
      await supabase.from('automation_jobs').update({ status: 'failed', error: 'Automation requires local environment with Playwright installed' }).eq('id', job.id);
      await supabase.from('postings').update({ status: 'failed', error: 'Automation requires a local environment with Playwright and Chromium installed.' })
        .eq('item_id', itemId).eq('user_id', user.id).eq('status', 'pending');
      return NextResponse.json({ success: false, error: 'Automation requires a local environment with Playwright and Chromium installed.' });
    }

    return NextResponse.json({ success: true, jobId: job.id });
  } catch (error: any) {
    console.error('POST /api/automation error:', error);
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to start automation' }, { status: 500 });
  }
}

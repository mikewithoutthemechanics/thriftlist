import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Cron endpoint to process scheduled postings.
 * Call this via Vercel Cron or external scheduler every 5-15 minutes.
 * Example Vercel cron: "0 * * * *" (hourly)
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabase();
    const { runAutomation } = await import('@/lib/automation');

    // 1. Check for jobs in automation_queue first
    const { data: queued, error: qError } = await supabase
      .from('automation_queue')
      .select('*')
      .eq('status', 'pending')
      .limit(5);

    if (qError) throw qError;

    for (const job of queued || []) {
      try {
        await supabase
          .from('automation_queue')
          .update({ status: 'processing' })
          .eq('id', job.id);

        await runAutomation({
          itemId: job.item_id,
          platforms: Array.isArray(job.platforms) ? job.platforms : JSON.parse(job.platforms),
          userId: job.user_id,
        });

        await supabase
          .from('automation_queue')
          .update({ status: 'completed', updated_at: new Date().toISOString() })
          .eq('id', job.id);
      } catch (err: any) {
        console.error(`Queued job ${job.id} failed:`, err);
        const nextRetries = (job.retries || 0) + 1;
        await supabase
          .from('automation_queue')
          .update({ 
            status: nextRetries > 3 ? 'failed' : 'pending', 
            error: err.message,
            retries: nextRetries,
            updated_at: new Date().toISOString()
          })
          .eq('id', job.id);
      }
    }

    // 2. Original logic for scheduled_postings (legacy/fallback)
    const { data: scheduled, error } = await supabase
      .from('scheduled_postings')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .limit(10);

    if (error) throw error;
    if (!scheduled || scheduled.length === 0) {
      return NextResponse.json({ processed: 0 });
    }

    const results = [];

    for (const job of scheduled) {
      try {
        await supabase
          .from('scheduled_postings')
          .update({ status: 'processing' })
          .eq('id', job.id);

        await runAutomation({
          itemId: job.item_id,
          platforms: job.platforms,
          userId: job.user_id,
        });

        await supabase
          .from('scheduled_postings')
          .update({ status: 'completed', completed_at: new Date().toISOString() })
          .eq('id', job.id);

        results.push({ id: job.id, status: 'completed' });
      } catch (err: any) {
        console.error(`Scheduled job ${job.id} failed:`, err);
        await supabase
          .from('scheduled_postings')
          .update({ status: 'failed', error: err.message })
          .eq('id', job.id);

        results.push({ id: job.id, status: 'failed', error: err.message });
      }
    }

    // 3. Market Pricing Scraper — runs daily at 2 AM
    try {
      const now = new Date();
      if (now.getHours() === 2) {
        const { scrapeMarketPrices } = await import('@/lib/market-scraper');
        await scrapeMarketPrices();
      }
    } catch (err) {
      console.error('Market pricing scraper error:', err);
    }

    return NextResponse.json({ processed: (queued?.length || 0) + (scheduled?.length || 0), results });
  } catch (error: any) {
    console.error('Cron process-scheduled error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

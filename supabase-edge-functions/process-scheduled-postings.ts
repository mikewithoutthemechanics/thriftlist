import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

Deno.serve(async (req: Request) => {
  try {
    // Verify the request is authorized (could use a secret header)
    const authHeader = req.headers.get('Authorization');
    if (authHeader !== `Bearer ${Deno.env.get('CRON_SECRET')}`) {
      return new Response('Unauthorized', { status: 401 });
    }

    console.log('Processing scheduled postings...');

    // Get scheduled postings that are due
    const { data: scheduledPostings, error } = await supabase
      .from('scheduled_postings')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .limit(10); // Process in batches

    if (error) {
      console.error('Error fetching scheduled postings:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch scheduled postings' }), { status: 500 });
    }

    console.log(`Found ${scheduledPostings?.length || 0} scheduled postings to process`);

    for (const scheduled of scheduledPostings || []) {
      console.log(`Processing scheduled posting ${scheduled.id} for item ${scheduled.item_id}`);

      try {
        // Call the automation API to start posting
        // APP_URL should be set to your deployed app URL (e.g., https://your-app.vercel.app)
        const appUrl = Deno.env.get('APP_URL') || supabaseUrl;
        const automationUrl = `${appUrl}/api/automation`;
        const automationRes = await fetch(automationUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
          },
          body: JSON.stringify({
            itemId: scheduled.item_id,
            platforms: scheduled.platforms,
            userId: scheduled.user_id,
          }),
        });

        if (automationRes.ok) {
          // Mark as completed
          await supabase
            .from('scheduled_postings')
            .update({ status: 'completed', updated_at: new Date().toISOString() })
            .eq('id', scheduled.id);
          console.log(`Scheduled posting ${scheduled.id} completed successfully`);
        } else {
          const errorText = await automationRes.text();
          await supabase
            .from('scheduled_postings')
            .update({ status: 'failed', error: errorText, updated_at: new Date().toISOString() })
            .eq('id', scheduled.id);
          console.error(`Scheduled posting ${scheduled.id} failed: ${errorText}`);
        }
      } catch (err: any) {
        await supabase
          .from('scheduled_postings')
          .update({ status: 'failed', error: err.message, updated_at: new Date().toISOString() })
          .eq('id', scheduled.id);
        console.error(`Error processing scheduled posting ${scheduled.id}:`, err);
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      processed: scheduledPostings?.length || 0 
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error in scheduled postings function:', err);
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

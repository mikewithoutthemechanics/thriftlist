import { NextRequest, NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { platform, itemId, status, externalId, webhookSecret } = body;

    // Verify webhook secret
    const supabase = await createClientServer();
    const { data: settings } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'webhook_secret')
      .single();

    if (!settings || settings.value !== webhookSecret) {
      return NextResponse.json({ error: 'Invalid webhook secret' }, { status: 401 });
    }

    // Find the posting by external ID or item ID
    const { data: posting } = await supabase
      .from('postings')
      .select('*')
      .or(`external_id.eq.${externalId},item_id.eq.${itemId}`)
      .eq('platform', platform)
      .single();

    if (!posting) {
      return NextResponse.json({ error: 'Posting not found' }, { status: 404 });
    }

    // Update posting status
    const { error: updateError } = await supabase
      .from('postings')
      .update({
        status: status,
        external_id: externalId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', posting.id);

    if (updateError) throw updateError;

    // If item is sold on platform, mark item as sold in inventory
    if (status === 'sold') {
      await supabase
        .from('items')
        .update({ status: 'sold', updated_at: new Date().toISOString() })
        .eq('id', posting.item_id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/webhooks/platform-sync error:', error);
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 });
  }
}

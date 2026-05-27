import { NextRequest, NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase-server';
import { scheduledPostingSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClientServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase
      .from('scheduled_postings')
      .select('*, items(title)')
      .eq('user_id', user.id)
      .order('scheduled_at', { ascending: true });

    if (error) throw error;
    return NextResponse.json({ scheduledPostings: data });
  } catch (error) {
    console.error('GET /api/scheduled-postings error:', error);
    return NextResponse.json({ error: 'Failed to fetch scheduled postings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClientServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const validatedData = scheduledPostingSchema.parse(body);

    const { data, error } = await supabase
      .from('scheduled_postings')
      .insert({
        user_id: user.id,
        item_id: validatedData.itemId,
        platforms: validatedData.platforms,
        scheduled_at: validatedData.scheduledAt,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, scheduledPosting: data });
  } catch (error: any) {
    console.error('POST /api/scheduled-postings error:', error);
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create scheduled posting' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClientServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const { error } = await supabase
      .from('scheduled_postings')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/scheduled-postings error:', error);
    return NextResponse.json({ error: 'Failed to delete scheduled posting' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClientServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');

    let query = supabase.from('postings').select('*, items(title)').eq('user_id', user.id).order('created_at', { ascending: false });
    if (itemId) query = query.eq('item_id', itemId);

    const { data, error } = await query;
    if (error) throw error;

    const postings = (data || []).map((row: any) => ({
      id: row.id,
      itemId: row.item_id,
      itemTitle: row.items?.title,
      platform: row.platform,
      status: row.status,
      url: row.url,
      error: row.error,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return NextResponse.json({ postings });
  } catch (error) {
    console.error('GET /api/postings error:', error);
    return NextResponse.json({ error: 'Failed to fetch postings' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClientServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const itemId = searchParams.get('itemId');

    if (id) {
      const { error } = await supabase.from('postings').delete().eq('id', id).eq('user_id', user.id);
      if (error) throw error;
    } else if (itemId) {
      const { error } = await supabase.from('postings').delete().eq('item_id', itemId).eq('user_id', user.id);
      if (error) throw error;
    } else {
      return NextResponse.json({ error: 'No id or itemId provided' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/postings error:', error);
    return NextResponse.json({ error: 'Failed to delete postings' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClientServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { id, status, url, error: errMsg } = body;

    const { error } = await supabase.from('postings').update({ status, url, error: errMsg }).eq('id', id).eq('user_id', user.id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH /api/postings error:', error);
    return NextResponse.json({ error: 'Failed to update posting' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClientServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { itemId, platform, url } = body;

    const { data, error } = await supabase.from('postings').insert({
      user_id: user.id,
      item_id: itemId,
      platform,
      status: 'posted',
      url: url || null,
    }).select().single();

    if (error) throw error;
    return NextResponse.json({ id: data.id, success: true });
  } catch (error) {
    console.error('POST /api/postings error:', error);
    return NextResponse.json({ error: 'Failed to create posting' }, { status: 500 });
  }
}

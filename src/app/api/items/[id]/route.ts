import { NextRequest, NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase-server';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClientServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase.from('items').select('*').eq('id', id).eq('user_id', user.id).single();
    if (error) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

    return NextResponse.json({ item: data });
  } catch (error) {
    console.error('GET /api/items/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch item' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClientServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { title, description, price, category, size, brand, condition, color, photos, platforms, status } = body;

    // Fetch old item for change tracking
    const { data: oldItem } = await supabase.from('items').select('*').eq('id', id).eq('user_id', user.id).single();

    const { data, error } = await supabase.from('items').update({
      title, description, price, category, size,
      brand: brand || null, condition, color: color || null,
      photos: photos || [], platforms: platforms || [], status,
    }).eq('id', id).eq('user_id', user.id).select().single();

    if (error) throw error;

    // Log activity
    if (oldItem) {
      const logs: any[] = [];
      const trackableFields = [
        { key: 'title', label: 'title' },
        { key: 'description', label: 'description' },
        { key: 'price', label: 'price' },
        { key: 'category', label: 'category' },
        { key: 'size', label: 'size' },
        { key: 'brand', label: 'brand' },
        { key: 'condition', label: 'condition' },
        { key: 'color', label: 'color' },
        { key: 'status', label: 'status' },
      ];
      for (const f of trackableFields) {
        const oldVal = (oldItem as any)[f.key];
        const newVal = (body as any)[f.key];
        if (oldVal !== newVal) {
          logs.push({
            item_id: id,
            user_id: user.id,
            action: 'updated',
            field: f.label,
            old_value: String(oldVal ?? ''),
            new_value: String(newVal ?? ''),
          });
        }
      }
      if (logs.length > 0) {
        await supabase.from('item_activity_log').insert(logs);
      }
    }

    return NextResponse.json({ item: data, success: true });
  } catch (error) {
    console.error('PUT /api/items/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const supabase = await createClientServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Log deletion before deleting
    await supabase.from('item_activity_log').insert({
      item_id: id,
      user_id: user.id,
      action: 'deleted',
    });

    const { error: postingError } = await supabase.from('postings').delete().eq('item_id', id).eq('user_id', user.id);
    if (postingError) throw postingError;

    const { error } = await supabase.from('items').delete().eq('id', id).eq('user_id', user.id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/items/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}

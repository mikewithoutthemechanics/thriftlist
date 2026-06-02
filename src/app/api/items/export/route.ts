import { NextRequest, NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClientServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';

    let query = supabase
      .from('items')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: items, error } = await query;

    if (error) throw error;

    // Convert items to CSV
    const headers = ['id', 'title', 'description', 'price', 'category', 'size', 'brand', 'condition', 'color', 'status', 'platforms', 'photos', 'created_at'];
    const csvRows = [
      headers.join(','),
      ...(items || []).map(item => [
        item.id,
        `"${(item.title || '').replace(/"/g, '""')}"`,
        `"${(item.description || '').replace(/"/g, '""')}"`,
        item.price,
        item.category,
        item.size,
        `"${(item.brand || '').replace(/"/g, '""')}"`,
        item.condition,
        `"${(item.color || '').replace(/"/g, '""')}"`,
        item.status,
        (item.platforms || []).join(','),
        (item.photos || []).join(','),
        item.created_at,
      ].join(','))
    ];

    const csv = csvRows.join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="thrift-list-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('GET /api/items/export error:', error);
    return NextResponse.json({ error: 'Failed to export items' }, { status: 500 });
  }
}

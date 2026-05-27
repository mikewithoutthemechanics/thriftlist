import { NextRequest, NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase-server';
import Papa from 'papaparse';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClientServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const text = await file.text();

    const results = Papa.parse(text, {
      header: true,
      skipEmptyLines: true,
    });

    if (results.errors.length > 0) {
      return NextResponse.json({ error: 'CSV parsing failed', details: results.errors }, { status: 400 });
    }

    const items = results.data as any[];
    const createdItems = [];
    const errors = [];

    for (const row of items) {
      try {
        // Map CSV columns to item schema
        const itemData = {
          user_id: user.id,
          title: row.title || row.Title || '',
          description: row.description || row.Description || row.desc || row.Desc || '',
          price: parseFloat(row.price || row.Price || '0'),
          category: row.category || row.Category || 'Tops',
          size: row.size || row.Size || 'M',
          brand: row.brand || row.Brand || null,
          condition: row.condition || row.Condition || 'good',
          color: row.color || row.Color || null,
          photos: row.photos || row.photos?.split(',') || [],
          platforms: row.platforms?.split(',') || ['facebook_marketplace'],
          status: 'ready',
        };

        const { data, error } = await supabase.from('items').insert(itemData).select().single();
        if (error) throw error;
        createdItems.push(data);
      } catch (err: any) {
        errors.push({ row: row.title || 'Unknown', error: err.message });
      }
    }

    return NextResponse.json({
      success: true,
      imported: createdItems.length,
      errors,
      total: items.length,
    });
  } catch (error) {
    console.error('POST /api/items/import error:', error);
    return NextResponse.json({ error: 'Failed to import items' }, { status: 500 });
  }
}

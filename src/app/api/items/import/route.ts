import { NextRequest, NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase-server';
import Papa from 'papaparse';

const VALID_CATEGORIES = ['Tops', 'Bottoms', 'Dresses', 'Outerwear', 'Shoes', 'Accessories', 'Activewear', 'Swimwear', 'Formal Wear', 'Vintage'];
const VALID_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'One Size'];
const VALID_CONDITIONS = ['new', 'like_new', 'good', 'fair', 'poor'];
const VALID_PLATFORMS = ['facebook_marketplace', 'yaga', 'gumtree', 'olx', 'junkmail'];
const MAX_ROWS = 100;

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

    if (items.length > MAX_ROWS) {
      return NextResponse.json({ error: `Maximum ${MAX_ROWS} rows allowed. Your file has ${items.length} rows.` }, { status: 400 });
    }

    const createdItems = [];
    const errors = [];

    for (let i = 0; i < items.length; i++) {
      const row = items[i];
      const rowLabel = row.title || row.Title || `Row ${i + 1}`;
      try {
        const title = (row.title || row.Title || '').trim();
        const description = (row.description || row.Description || row.desc || row.Desc || '').trim();
        const priceRaw = row.price || row.Price || '';
        const price = parseFloat(priceRaw);
        const category = (row.category || row.Category || 'Tops').trim();
        const size = (row.size || row.Size || 'M').trim();
        const condition = (row.condition || row.Condition || 'good').trim().toLowerCase().replace(/\s+/g, '_');
        const color = (row.color || row.Color || '').trim() || null;
        const brand = (row.brand || row.Brand || '').trim() || null;

        // Validation
        if (!title) throw new Error('Title is required');
        if (!description) throw new Error('Description is required');
        if (!priceRaw || isNaN(price) || price <= 0) throw new Error('Valid price is required');
        if (!VALID_CATEGORIES.includes(category)) throw new Error(`Invalid category: ${category}. Must be one of: ${VALID_CATEGORIES.join(', ')}`);
        if (!VALID_SIZES.includes(size)) throw new Error(`Invalid size: ${size}. Must be one of: ${VALID_SIZES.join(', ')}`);
        if (!VALID_CONDITIONS.includes(condition)) throw new Error(`Invalid condition: ${condition}. Must be one of: ${VALID_CONDITIONS.join(', ')}`);

        const rawPlatforms = row.platforms ? row.platforms.split(',').map((s: string) => s.trim()).filter(Boolean) : ['facebook_marketplace'];
        const platforms = rawPlatforms.filter((p: string) => VALID_PLATFORMS.includes(p));
        if (platforms.length === 0) platforms.push('facebook_marketplace');

        const itemData = {
          user_id: user.id,
          title,
          description,
          price,
          category,
          size,
          brand,
          condition,
          color,
          photos: row.photos ? row.photos.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
          platforms,
          status: 'ready',
        };

        const { data, error } = await supabase.from('items').insert(itemData).select().single();
        if (error) throw error;
        createdItems.push(data);
      } catch (err: any) {
        errors.push({ row: rowLabel, error: err.message });
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

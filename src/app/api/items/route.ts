import { NextRequest, NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase-server';
import { itemSchema } from '@/lib/validation';
import { checkRateLimit, getIdentifier } from '@/lib/rate-limit';
import crypto from 'crypto';

function generateItemHash(title: string, description: string, price: number): string {
  const data = `${title.toLowerCase().trim()}|${description.toLowerCase().trim()}|${price}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

export async function GET(request: NextRequest) {
  try {
    const identifier = getIdentifier(request);
    const rateLimit = checkRateLimit(identifier, { maxRequests: 100, windowMs: 60000 });
    
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many requests', retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000) },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '100',
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.resetTime.toString(),
          }
        }
      );
    }

    const supabase = await createClientServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '12'), 100);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const start = (page - 1) * limit;

    let query = supabase.from('items').select('*', { count: 'exact' }).eq('user_id', user.id);
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }
    if (status) query = query.eq('status', status);

    const { data, count, error } = await query.order('created_at', { ascending: false }).range(start, start + limit - 1);
    if (error) throw error;

    return NextResponse.json({ items: data || [], total: count || 0, page, limit });
  } catch (error) {
    console.error('GET /api/items error:', error);
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const identifier = getIdentifier(request);
    const rateLimit = checkRateLimit(identifier, { maxRequests: 20, windowMs: 60000 });
    
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Too many requests', retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000) },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '20',
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
    const validatedData = itemSchema.parse(body);

    // Check for duplicates
    const itemHash = generateItemHash(validatedData.title, validatedData.description, validatedData.price);
    const { data: existingItem } = await supabase
      .from('items')
      .select('id, title')
      .eq('user_id', user.id)
      .eq('item_hash', itemHash)
      .maybeSingle();

    if (existingItem) {
      return NextResponse.json(
        { error: 'Duplicate item detected', duplicateId: existingItem.id, duplicateTitle: existingItem.title },
        { status: 409 }
      );
    }

    const { data, error } = await supabase.from('items').insert({
      item_hash: itemHash,
      user_id: user.id,
      title: validatedData.title,
      description: validatedData.description,
      price: validatedData.price,
      category: validatedData.category,
      size: validatedData.size,
      brand: validatedData.brand || null,
      condition: validatedData.condition,
      color: validatedData.color || null,
      photos: validatedData.photos,
      platforms: validatedData.platforms,
      status: 'ready',
    }).select().single();

    if (error) throw error;
    return NextResponse.json({ id: data.id, success: true });
  } catch (error: any) {
    console.error('POST /api/items error:', error);
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
  }
}

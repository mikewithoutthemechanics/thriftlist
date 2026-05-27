import { NextRequest, NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase-server';
import { settingsSchema } from '@/lib/validation';

export async function GET() {
  try {
    const supabase = await createClientServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase.from('settings').select('*').eq('user_id', user.id);
    if (error) throw error;

    const settings: Record<string, string> = {};
    for (const s of data || []) settings[s.key] = s.value;
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('GET /api/settings error:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClientServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { key, value } = body;
    if (!key) return NextResponse.json({ error: 'Key is required' }, { status: 400 });

    // Validate individual setting value
    const partialSettings = { [key]: value };
    settingsSchema.partial().parse(partialSettings);

    const { error } = await supabase.from('settings').upsert({ user_id: user.id, key, value }, { onConflict: 'user_id,key' });
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('POST /api/settings error:', error);
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to save setting' }, { status: 500 });
  }
}

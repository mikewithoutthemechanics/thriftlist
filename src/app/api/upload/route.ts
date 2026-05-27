import { NextRequest, NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClientServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const path = `${user.id}/${filename}`;

    const { error: uploadError } = await supabase.storage.from('uploads').upload(path, buffer, {
      contentType: file.type || 'image/jpeg',
    });
    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(path);
    return NextResponse.json({ url: publicUrl });
  } catch (error: any) {
    console.error('POST /api/upload error:', error);
    return NextResponse.json({ error: error.message || 'Failed to upload file' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase-server';
import sharp from 'sharp';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClientServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const autoParse = formData.get('autoParse') === 'true';
    const removeBackground = formData.get('removeBackground') === 'true';

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    let buffer = Buffer.from(await file.arrayBuffer());

    // 1. Optional Background Removal (using sharp as a placeholder/basic version)
    // Real background removal usually requires a specialized AI model/API
    if (removeBackground) {
      try {
        // Basic sharp optimization for now
        buffer = await sharp(buffer)
          .trim() // remove transparent edges if any
          .toBuffer();
      } catch (err) {
        console.warn('Background removal failed:', err);
      }
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const path = `${user.id}/${filename}`;

    const { error: uploadError } = await supabase.storage.from('uploads').upload(path, buffer, {
      contentType: file.type || 'image/jpeg',
    });
    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(path);

    // 2. Auto-Parse using Vision AI
    let aiParsed = null;
    if (autoParse) {
      try {
        const groqApiKey = process.env.GROQ_API_KEY;
        if (groqApiKey) {
          const base64 = buffer.toString('base64');
          const aiResponse = await fetch(`${request.nextUrl.origin}/api/ai`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Cookie': request.headers.get('cookie') || '',
            },
            body: JSON.stringify({
              type: 'parse_photo',
              data: { imageBase64: base64 }
            }),
          });
          
          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            aiParsed = aiData.result;
          }
        }
      } catch (err) {
        console.error('Auto-parsing failed:', err);
      }
    }

    return NextResponse.json({ 
      url: publicUrl,
      aiParsed
    });
  } catch (error: any) {
    console.error('POST /api/upload error:', error);
    return NextResponse.json({ error: error.message || 'Failed to upload file' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase-server';
import { startPlatformAuth, savePlatformAuth } from '@/lib/automation';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const startSchema = z.object({
  platform: z.string(),
});

const saveSchema = z.object({
  platform: z.string(),
  sessionId: z.string(),
});

/**
 * POST /api/platform-auth
 * Body: { platform: string } to start auth session
 * Body: { platform: string, sessionId: string } to save cookies after manual login
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClientServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();

    // If sessionId is provided, save cookies
    if (body.sessionId) {
      const validated = saveSchema.parse(body);
      await savePlatformAuth(user.id, validated.platform, validated.sessionId);
      return NextResponse.json({ success: true, message: `${validated.platform} authentication saved.` });
    }

    // Otherwise, start a new auth session
    const validated = startSchema.parse(body);
    const session = await startPlatformAuth(user.id, validated.platform);

    return NextResponse.json({
      success: true,
      sessionId: session.sessionId,
      liveViewUrl: session.liveViewUrl,
      message: `Open the Live View URL to log in to ${validated.platform}. After logging in, click "Save Authentication".`,
    });
  } catch (error: any) {
    console.error('POST /api/platform-auth error:', error);
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || 'Failed to manage platform authentication' }, { status: 500 });
  }
}

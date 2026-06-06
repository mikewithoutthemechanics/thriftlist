import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { timingSafeEqual } from 'node:crypto';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function isAuthorized(request: NextRequest): boolean {
  const configuredSecret = process.env.MIGRATIONS_API_SECRET;
  if (!configuredSecret) return false;

  const headerSecret = request.headers.get('x-migrations-secret');
  const authHeader = request.headers.get('authorization');
  const bearerSecret = authHeader?.toLowerCase().startsWith('bearer ') ? authHeader.slice(7) : null;
  const providedSecret = headerSecret || bearerSecret;
  if (!providedSecret) return false;

  const a = Buffer.from(providedSecret);
  const b = Buffer.from(configuredSecret);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.MIGRATIONS_API_SECRET) {
      return NextResponse.json({ error: 'Migrations endpoint is disabled' }, { status: 503 });
    }

    if (!isAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseServiceKey) {
      return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY not configured' }, { status: 500 });
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const migrations = [
      {
        name: 'scheduled_postings',
        sql: `
          CREATE TABLE IF NOT EXISTS public.scheduled_postings (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            item_id TEXT NOT NULL,
            platforms TEXT[] NOT NULL,
            scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            error TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );

          CREATE INDEX IF NOT EXISTS idx_scheduled_postings_user_id ON public.scheduled_postings(user_id);
          CREATE INDEX IF NOT EXISTS idx_scheduled_postings_status ON public.scheduled_postings(status);
          CREATE INDEX IF NOT EXISTS idx_scheduled_postings_scheduled_at ON public.scheduled_postings(scheduled_at);

          ALTER TABLE public.scheduled_postings ENABLE ROW LEVEL SECURITY;

          DROP POLICY IF EXISTS "Users can view their own scheduled postings" ON public.scheduled_postings;
          DROP POLICY IF EXISTS "Users can insert their own scheduled postings" ON public.scheduled_postings;
          DROP POLICY IF EXISTS "Users can update their own scheduled postings" ON public.scheduled_postings;
          DROP POLICY IF EXISTS "Users can delete their own scheduled postings" ON public.scheduled_postings;

          CREATE POLICY "Users can view their own scheduled postings"
            ON public.scheduled_postings FOR SELECT
            USING (auth.uid() = user_id);

          CREATE POLICY "Users can insert their own scheduled postings"
            ON public.scheduled_postings FOR INSERT
            WITH CHECK (auth.uid() = user_id);

          CREATE POLICY "Users can update their own scheduled postings"
            ON public.scheduled_postings FOR UPDATE
            USING (auth.uid() = user_id);

          CREATE POLICY "Users can delete their own scheduled postings"
            ON public.scheduled_postings FOR DELETE
            USING (auth.uid() = user_id);
        `
      },
      {
        name: 'templates',
        sql: `
          CREATE TABLE IF NOT EXISTS public.templates (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            description_template TEXT NOT NULL,
            category TEXT,
            platforms TEXT[] DEFAULT ARRAY[]::TEXT[],
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );

          CREATE INDEX IF NOT EXISTS idx_templates_user_id ON public.templates(user_id);

          ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

          DROP POLICY IF EXISTS "Users can view their own templates" ON public.templates;
          DROP POLICY IF EXISTS "Users can insert their own templates" ON public.templates;
          DROP POLICY IF EXISTS "Users can update their own templates" ON public.templates;
          DROP POLICY IF EXISTS "Users can delete their own templates" ON public.templates;

          CREATE POLICY "Users can view their own templates"
            ON public.templates FOR SELECT
            USING (auth.uid() = user_id);

          CREATE POLICY "Users can insert their own templates"
            ON public.templates FOR INSERT
            WITH CHECK (auth.uid() = user_id);

          CREATE POLICY "Users can update their own templates"
            ON public.templates FOR UPDATE
            USING (auth.uid() = user_id);

          CREATE POLICY "Users can delete their own templates"
            ON public.templates FOR DELETE
            USING (auth.uid() = user_id);
        `
      },
      {
        name: 'notifications',
        sql: `
          CREATE TABLE IF NOT EXISTS public.notifications (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            type TEXT NOT NULL DEFAULT 'info',
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            metadata JSONB DEFAULT '{}',
            read BOOLEAN NOT NULL DEFAULT false,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );

          CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
          CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
          CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

          ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

          DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
          DROP POLICY IF EXISTS "Users can insert their own notifications" ON public.notifications;
          DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
          DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;

          CREATE POLICY "Users can view their own notifications"
            ON public.notifications FOR SELECT
            USING (auth.uid() = user_id);

          CREATE POLICY "Users can insert their own notifications"
            ON public.notifications FOR INSERT
            WITH CHECK (auth.uid() = user_id);

          CREATE POLICY "Users can update their own notifications"
            ON public.notifications FOR UPDATE
            USING (auth.uid() = user_id);

          CREATE POLICY "Users can delete their own notifications"
            ON public.notifications FOR DELETE
            USING (auth.uid() = user_id);
        `
      }
    ];

    const results: Array<{ name: string; success: boolean; error?: string }> = [];

    for (const migration of migrations) {
      const { error } = await supabase.rpc('exec_sql', { sql: migration.sql });
      if (error) {
        results.push({ name: migration.name, success: false, error: error.message });
      } else {
        results.push({ name: migration.name, success: true });
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

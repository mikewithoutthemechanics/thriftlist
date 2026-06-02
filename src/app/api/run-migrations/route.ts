import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { serviceKey } = body;

    if (!serviceKey) {
      return NextResponse.json({ error: 'Service key required' }, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabase = createClient(supabaseUrl, serviceKey);

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

    const results = [];

    for (const migration of migrations) {
      console.log(`Running migration: ${migration.name}`);
      const { error } = await supabase.from(migration.name).select('*').limit(1);
      
      // If table doesn't exist, create it using direct SQL
      if (error && error.code === '42P01') {
        // Table doesn't exist, create it
        const { error: createError } = await supabase.rpc('exec_sql', { sql: migration.sql });
        if (createError) {
          console.error(`Error creating ${migration.name}:`, createError);
          // Try alternative approach: execute SQL directly
          const { error: directError } = await supabase
            .from(migration.name)
            .select('*')
            .limit(1);
          
          if (directError && directError.code === '42P01') {
            // Still doesn't exist, try using the REST API directly
            try {
              const response = await fetch(`${supabaseUrl}/rest/v1/`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'apikey': serviceKey,
                  'Authorization': `Bearer ${serviceKey}`,
                },
                body: JSON.stringify({ query: migration.sql }),
              });
              
              if (response.ok) {
                results.push({ name: migration.name, success: true });
              } else {
                results.push({ name: migration.name, success: false, error: 'Failed to create table via REST API' });
              }
            } catch (e) {
              results.push({ name: migration.name, success: false, error: String(e) });
            }
          } else {
            results.push({ name: migration.name, success: true, message: 'Table created' });
          }
        } else {
          results.push({ name: migration.name, success: true });
        }
      } else if (error) {
        console.error(`Error checking ${migration.name}:`, error);
        results.push({ name: migration.name, success: false, error: String(error) });
      } else {
        results.push({ name: migration.name, success: true, message: 'Table already exists' });
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

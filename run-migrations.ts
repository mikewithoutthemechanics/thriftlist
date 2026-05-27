import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigrations() {
  console.log('Running migrations...');

  // Create scheduled_postings table
  console.log('Creating scheduled_postings table...');
  const { error: scheduledError } = await supabase.rpc('exec_sql', {
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
  });

  if (scheduledError) {
    console.error('Error creating scheduled_postings table:', scheduledError);
  } else {
    console.log('✓ scheduled_postings table created');
  }

  // Create templates table
  console.log('Creating templates table...');
  const { error: templatesError } = await supabase.rpc('exec_sql', {
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
  });

  if (templatesError) {
    console.error('Error creating templates table:', templatesError);
  } else {
    console.log('✓ templates table created');
  }

  console.log('Migrations complete!');
}

runMigrations().catch(console.error);

import { NextRequest, NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClientServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { action } = await request.json();

    if (action === 'auto-configure') {
      const fs = await import('fs');
      const path = await import('path');
      const schemaPath = path.join(process.cwd(), 'supabase-schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf8');

      // Split schema into individual commands (crude split, but works for most migrations)
      const commands = schema
        .split(';')
        .map(cmd => cmd.trim())
        .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

      const results = [];
      for (const cmd of commands) {
        try {
          // Note: In a real production app, you'd use a better way to run migrations.
          // Supabase's service role can run many but not all commands via the API.
          // For this specific setup, we assume the user has configured the service role key.
          const { error } = await supabase.rpc('exec_sql', { sql_query: cmd });
          if (error) {
            // Some commands might fail if already exists, we log but continue
            console.warn(`SQL Command failed: ${cmd.substring(0, 50)}...`, error);
            results.push({ cmd: cmd.substring(0, 50), status: 'error', error: error.message });
          } else {
            results.push({ cmd: cmd.substring(0, 50), status: 'success' });
          }
        } catch (e: any) {
          results.push({ cmd: cmd.substring(0, 50), status: 'exception', error: e.message });
        }
      }

      return NextResponse.json({ success: true, results });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error: any) {
    console.error('Setup guide POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  const guide = {
    steps: [] as any[],
    envStatus: {} as Record<string, boolean>,
    overall: 'incomplete' as 'complete' | 'incomplete' | 'partial',
  };

  // Check environment variables
  const envChecks = {
    supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabase_anon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    supabase_service: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    encryption_key: !!process.env.ENCRYPTION_KEY,
    groq: !!process.env.GROQ_API_KEY,
    resend: !!process.env.RESEND_API_KEY,
    browserbase: !!process.env.BROWSERBASE_API_KEY && !!process.env.BROWSERBASE_PROJECT_ID,
    facebook: !!process.env.FACEBOOK_APP_ID && !!process.env.FACEBOOK_APP_SECRET,
  };

  guide.envStatus = envChecks;

  const requiredOk = envChecks.supabase_url && envChecks.supabase_anon && envChecks.supabase_service && envChecks.encryption_key;
  const optionalCount = [envChecks.groq, envChecks.resend, envChecks.browserbase, envChecks.facebook].filter(Boolean).length;

  if (requiredOk && optionalCount >= 2) guide.overall = 'complete';
  else if (requiredOk) guide.overall = 'partial';

  // Build step-by-step guide
  guide.steps = [
    {
      id: 'supabase',
      title: 'Connect Supabase',
      description: 'Core database and authentication backend',
      required: true,
      complete: envChecks.supabase_url && envChecks.supabase_anon,
      action: {
        text: 'Create Supabase Project',
        link: 'https://supabase.com/dashboard',
      },
      fields: ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'],
    },
    {
      id: 'auto-configure',
      title: 'Auto-Configure Database',
      description: 'Automatically inject the necessary database schema and tables',
      required: true,
      complete: false, // Will be updated by frontend after action
      action: {
        text: 'Auto-Configure',
        link: null,
        apiAction: 'auto-configure',
      },
      fields: [],
    },
    {
      id: 'encryption',
      title: 'Set Encryption Key',
      description: 'Required for secure credential storage',
      required: true,
      complete: envChecks.encryption_key,
      action: {
        text: 'Generate Key',
        link: null,
        hint: 'Any 32-character string works. Example: my-secret-encryption-key-32chars!',
      },
      fields: ['ENCRYPTION_KEY'],
    },
    {
      id: 'groq',
      title: 'Add Groq AI',
      description: 'AI-powered title, description, and price optimization',
      required: false,
      complete: envChecks.groq,
      action: {
        text: 'Get Groq API Key',
        link: 'https://console.groq.com/keys',
      },
      fields: ['GROQ_API_KEY'],
    },
    {
      id: 'resend',
      title: 'Add Resend Email',
      description: 'Email notifications for posting status',
      required: false,
      complete: envChecks.resend,
      action: {
        text: 'Get Resend API Key',
        link: 'https://resend.com/api-keys',
      },
      fields: ['RESEND_API_KEY'],
    },
    {
      id: 'browserbase',
      title: 'Add Browserbase',
      description: 'Cloud browser automation for Vercel deployment',
      required: false,
      complete: envChecks.browserbase,
      action: {
        text: 'Get Browserbase Key',
        link: 'https://browserbase.com/settings',
      },
      fields: ['BROWSERBASE_API_KEY', 'BROWSERBASE_PROJECT_ID'],
    },
    {
      id: 'facebook',
      title: 'Add Facebook OAuth',
      description: 'Connect Facebook for automated posting',
      required: false,
      complete: envChecks.facebook,
      action: {
        text: 'Create Facebook App',
        link: 'https://developers.facebook.com/apps',
      },
      fields: ['FACEBOOK_APP_ID', 'FACEBOOK_APP_SECRET'],
    },
  ];

  return NextResponse.json(guide);
}

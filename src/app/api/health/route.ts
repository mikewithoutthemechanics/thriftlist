import { NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const checks: Record<string, any> = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    checks: {},
  };

  // Supabase connection
  try {
    const supabase = await createClientServer();
    const { error } = await supabase.from('items').select('id').limit(1);
    checks.checks.supabase = { status: error ? 'error' : 'ok', error: error?.message };
  } catch (err: any) {
    checks.checks.supabase = { status: 'error', error: err.message };
  }

  // Groq API
  try {
    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      checks.checks.groq = { status: 'error', error: 'GROQ_API_KEY not set' };
    } else {
      const res = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { Authorization: `Bearer ${groqKey}` },
      });
      checks.checks.groq = { status: res.ok ? 'ok' : 'error', statusCode: res.status };
    }
  } catch (err: any) {
    checks.checks.groq = { status: 'error', error: err.message };
  }

  // Resend API (optional - notifications now use in-app bell)
  try {
    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      checks.checks.resend = { status: 'warning', message: 'RESEND_API_KEY not set — in-app notifications active instead' };
    } else {
      const res = await fetch('https://api.resend.com/domains', {
        headers: { Authorization: `Bearer ${resendKey}` },
      });
      checks.checks.resend = { status: res.ok ? 'ok' : 'error', statusCode: res.status };
    }
  } catch (err: any) {
    checks.checks.resend = { status: 'error', error: err.message };
  }

  // Browserbase
  try {
    const bbKey = process.env.BROWSERBASE_API_KEY;
    const bbProject = process.env.BROWSERBASE_PROJECT_ID;
    if (!bbKey || !bbProject) {
      checks.checks.browserbase = { status: 'error', error: 'BROWSERBASE_API_KEY or PROJECT_ID not set' };
    } else {
      checks.checks.browserbase = { status: 'ok', configured: true };
    }
  } catch (err: any) {
    checks.checks.browserbase = { status: 'error', error: err.message };
  }

  // Facebook OAuth
  try {
    const fbAppId = process.env.FACEBOOK_APP_ID;
    const fbSecret = process.env.FACEBOOK_APP_SECRET;
    checks.checks.facebook_oauth = {
      status: (fbAppId && fbSecret) ? 'ok' : 'warning',
      configured: !!fbAppId && !!fbSecret,
    };
  } catch (err: any) {
    checks.checks.facebook_oauth = { status: 'error', error: err.message };
  }

  // Encryption
  try {
    const encKey = process.env.ENCRYPTION_KEY;
    checks.checks.encryption = {
      status: encKey ? 'ok' : 'warning',
      configured: !!encKey,
    };
  } catch (err: any) {
    checks.checks.encryption = { status: 'error', error: err.message };
  }

  // Marketplace Authentication Health
  try {
    const supabase = await createClientServer();
    const { data: cookies } = await supabase.from('platform_cookies').select('platform, updated_at');
    
    const platformAuth: Record<string, any> = {};
    for (const c of cookies || []) {
      const updatedAt = new Date(c.updated_at);
      const now = new Date();
      const ageDays = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24);
      
      platformAuth[c.platform] = {
        status: ageDays > 30 ? 'warning' : 'ok',
        lastUpdated: c.updated_at,
        ageDays: Math.floor(ageDays),
        needsRefresh: ageDays > 30
      };
    }
    checks.checks.platform_auth = platformAuth;
  } catch (err: any) {
    checks.checks.platform_auth = { status: 'error', error: err.message };
  }

  // Overall status
  const hasErrors = Object.values(checks.checks).some((c: any) => c.status === 'error');
  checks.status = hasErrors ? 'degraded' : 'ok';

  return NextResponse.json(checks);
}

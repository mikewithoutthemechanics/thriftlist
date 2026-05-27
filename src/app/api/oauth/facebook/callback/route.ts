import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { encrypt } from '@/lib/encryption';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(`/settings?error=facebook_oauth_denied`);
  }

  if (!code) {
    return NextResponse.redirect(`/settings?error=missing_code`);
  }

  const appId = process.env.FACEBOOK_APP_ID;
  const appSecret = process.env.FACEBOOK_APP_SECRET;

  if (!appId || !appSecret) {
    return NextResponse.redirect(`/settings?error=facebook_not_configured`);
  }

  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const redirectUri = `${baseUrl}/api/oauth/facebook/callback`;

  try {
    // Exchange code for access token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?` +
      `client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `client_secret=${appSecret}&code=${code}`
    );

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || !tokenData.access_token) {
      console.error('Facebook token exchange failed:', tokenData);
      return NextResponse.redirect(`/settings?error=token_exchange_failed`);
    }

    const accessToken = tokenData.access_token;

    // Get user info to identify the user
    const userRes = await fetch(
      `https://graph.facebook.com/v18.0/me?access_token=${accessToken}&fields=id,name,email`
    );
    const userData = await userRes.json();

    // Encrypt token before storing
    const encryptedToken = encrypt(accessToken);

    // Store in Supabase settings (requires service role key for cross-user storage)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current user from session
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.redirect(`/settings?error=not_authenticated`);
    }

    await supabase.from('settings').upsert({
      user_id: user.id,
      key: 'facebook_oauth_token',
      value: encryptedToken,
    });

    await supabase.from('settings').upsert({
      user_id: user.id,
      key: 'facebook_oauth_name',
      value: userData.name || 'Connected',
    });

    return NextResponse.redirect(`/settings?success=facebook_connected`);
  } catch (err) {
    console.error('Facebook OAuth callback error:', err);
    return NextResponse.redirect(`/settings?error=oauth_callback_error`);
  }
}

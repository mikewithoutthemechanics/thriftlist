import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const appId = process.env.FACEBOOK_APP_ID;
  if (!appId) {
    return NextResponse.json({ error: 'FACEBOOK_APP_ID not configured' }, { status: 500 });
  }

  // Determine the redirect URI
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const redirectUri = `${baseUrl}/api/oauth/facebook/callback`;

  // Scopes needed for posting to pages (Marketplace API is restricted)
  const scopes = ['pages_manage_posts', 'pages_read_engagement', 'publish_to_groups'];

  const authUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth');
  authUrl.searchParams.set('client_id', appId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('scope', scopes.join(','));
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('state', generateState());

  return NextResponse.redirect(authUrl.toString());
}

function generateState(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

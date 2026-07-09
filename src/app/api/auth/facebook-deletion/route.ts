import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  const facebookAppSecret = process.env.FACEBOOK_APP_SECRET;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!facebookAppSecret) {
    console.error('FACEBOOK_APP_SECRET environment variable is missing');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  let signedRequest: string | null = null;

  try {
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      signedRequest = formData.get('signed_request') as string;
    } else {
      const body = await request.json();
      signedRequest = body?.signed_request || null;
    }
  } catch (err) {
    console.error('Error reading request body:', err);
  }

  if (!signedRequest) {
    return NextResponse.json({ error: 'Missing signed_request parameter' }, { status: 400 });
  }

  // 1. Verify and parse the signed request
  const payload = parseSignedRequest(signedRequest, facebookAppSecret);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid signed_request signature' }, { status: 400 });
  }

  const facebookUserId = payload.user_id;
  if (!facebookUserId) {
    return NextResponse.json({ error: 'User ID not found in payload' }, { status: 400 });
  }

  // 2. Perform deletion in Supabase if service key is provided
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Supabase credentials missing. Cannot execute deletion.');
    return NextResponse.json({ error: 'Database configuration missing' }, { status: 500 });
  }

  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data, error } = await supabaseAdmin.rpc('delete_user_by_facebook_id', {
      fb_id: facebookUserId,
    });

    if (error) {
      console.error('Error executing delete_user_by_facebook_id RPC:', error);
      return NextResponse.json({ error: 'Database deletion failed' }, { status: 500 });
    }

    console.log(`Successfully deleted Facebook user ${facebookUserId}. Database result: ${data}`);
  } catch (err) {
    console.error('Exception during user deletion execution:', err);
    return NextResponse.json({ error: 'Internal deletion process failed' }, { status: 500 });
  }

  // 3. Generate response details
  const confirmationCode = crypto.randomBytes(12).toString('hex');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.bagmati.shop';
  const sanitizedAppUrl = appUrl.endsWith('/') ? appUrl.slice(0, -1) : appUrl;
  const statusUrl = `${sanitizedAppUrl}/auth/facebook-deletion/status?code=${confirmationCode}`;

  return NextResponse.json({
    url: statusUrl,
    confirmation_code: confirmationCode,
  });
}

function parseSignedRequest(signedRequest: string, secret: string) {
  try {
    const parts = signedRequest.split('.');
    if (parts.length !== 2) return null;

    const [encodedSig, payload] = parts;

    // Decode signature
    const sig = Buffer.from(encodedSig.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
    
    // Calculate expected HMAC-SHA256 signature
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest();

    if (!crypto.timingSafeEqual(sig, expectedSig)) {
      console.error('Signed request signature verification failed.');
      return null;
    }

    // Decode and parse payload JSON
    const data = JSON.parse(
      Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
    );

    if (!data.algorithm || data.algorithm.toUpperCase() !== 'HMAC-SHA256') {
      console.error('Invalid signature algorithm:', data.algorithm);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Error parsing signed request:', err);
    return null;
  }
}

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Get the authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // ── Role Guard: Block admin/vendor from customer portal ───────────────
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, role, full_name, avatar_url')
          .eq('id', user.id)
          .maybeSingle();

        if (profile?.role === 'admin' || profile?.role === 'vendor') {
          await supabase.auth.signOut();
          return NextResponse.redirect(
            `${origin}/login?error=Access%20Denied%3A%20Admin%20and%20Vendor%20accounts%20cannot%20login%20on%20the%20customer%20portal.`
          );
        }

        // ── OAuth Profile Sync ────────────────────────────────────────────────
        // Extract name and avatar from Google/Facebook OAuth metadata
        const oauthName =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.user_metadata?.user_name ||
          '';
        const oauthAvatar =
          user.user_metadata?.avatar_url ||
          user.user_metadata?.picture ||
          '';

        if (!profile) {
          // New OAuth user — create profile row
          await supabase.from('profiles').upsert({
            id: user.id,
            email: user.email,
            full_name: oauthName,
            avatar_url: oauthAvatar,
            role: 'customer',
          }, { onConflict: 'id' });
        } else if (oauthAvatar && !profile.avatar_url) {
          // Existing profile missing avatar — sync from OAuth
          await supabase
            .from('profiles')
            .update({ avatar_url: oauthAvatar })
            .eq('id', user.id);
        }
      }
      
      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';
      
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // Auth failed - return to login with error
  return NextResponse.redirect(`${origin}/login?error=Authentication%20failed.%20Please%20try%20again.`);
}

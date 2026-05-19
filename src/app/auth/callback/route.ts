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
      // Strict constraint check: Customers only!
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        const role = profile?.role;
        
        if (role === 'admin' || role === 'vendor') {
          await supabase.auth.signOut();
          return NextResponse.redirect(
            `${origin}/login?error=Access%20Denied%3A%20Admin%20and%20Vendor%20accounts%20cannot%20login%20on%20the%20customer%20portal.`
          );
        }
      }
      
      const forwardedHost = request.headers.get('x-forwarded-host'); // original origin before load balancer
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

  // Auth failed - return with error query
  return NextResponse.redirect(`${origin}/login?error=Authentication%20failed`);
}

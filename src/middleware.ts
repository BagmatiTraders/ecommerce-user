import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If user is not logged in and trying to access admin or vendor pages
  if (!user && (request.nextUrl.pathname.startsWith('/admin') || request.nextUrl.pathname.startsWith('/vendor'))) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Role-based protection
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role

    // Admin pages protection
    if (request.nextUrl.pathname.startsWith('/admin') && role !== 'admin') {
      return NextResponse.redirect(new URL(role === 'vendor' ? '/vendor' : '/', request.url))
    }

    // Vendor pages protection
    if (request.nextUrl.pathname.startsWith('/vendor') && role !== 'vendor' && role !== 'admin') {
      return NextResponse.redirect(new URL(role === 'admin' ? '/admin' : '/', request.url))
    }

    // Redirect logged in users from auth pages
    if (user && (request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/signup'))) {
      return NextResponse.redirect(new URL(role === 'admin' ? '/admin' : (role === 'vendor' ? '/vendor' : '/'), request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/vendor/:path*',
    '/login',
    '/signup'
  ],
}

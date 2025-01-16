import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  // Initialize response
  let response = NextResponse.next({
    request,
  })

  // Create Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Get user session
  const { data: { user } } = await supabase.auth.getUser()

  // Handle protected routes
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/pools') ||
                        request.nextUrl.pathname.startsWith('/wallet')
  
  // Redirect to login if accessing protected route without auth
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // If user is authenticated and on a protected route, check for wallet
  if (user && isProtectedRoute) {
    try {
      // Check if user has a wallet
      const { data: walletData } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (!walletData) {
        console.log('No wallet found, creating one')
        // Create wallet automatically via API route
        const createWalletResponse = await fetch(new URL('/api/wallet', request.url).toString(), {
          method: 'Get',
          headers: {
            cookie: request.headers.get('cookie') || '',
          },
        })

        if (!createWalletResponse.ok) {
          console.error('Failed to create wallet automatically')
        }
      }
    } catch (error) {
      console.error('Middleware error:', error)
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
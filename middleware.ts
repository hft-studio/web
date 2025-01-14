import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { Wallet } from '@coinbase/coinbase-sdk'

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
  const isProtectedRoute = request.nextUrl.pathname.startsWith('/dashboard') || 
                          request.nextUrl.pathname.startsWith('/pools')
  
  const isAuthRoute = request.nextUrl.pathname.startsWith('/login') || 
                     request.nextUrl.pathname.startsWith('/auth')

  // Redirect to login if accessing protected route without auth
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // If user is authenticated and on a protected route, ensure they have a wallet
  if (user && isProtectedRoute) {
    try {
      // Check if user has a wallet
      const { data: walletData } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (!walletData) {
        // Create new wallet
        const newWallet = await Wallet.create()
        
        // Store wallet info
        const { error: walletError } = await supabase
          .from('wallets')
          .insert({
            user_id: user.id,
            wallet_id: newWallet.getId(),
            created_at: new Date().toISOString()
          })

        if (walletError) {
          console.error('Error creating wallet:', walletError)
          // Optionally redirect to error page
          // return NextResponse.redirect(new URL('/error', request.url))
        }
      }
    } catch (error) {
      console.error('Middleware error:', error)
      // Handle error appropriately
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
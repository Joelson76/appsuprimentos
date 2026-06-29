import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Apenas verificar se tem sessão - SEM queries adicionais
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const isAuthPage = request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/cadastro'
  const isPublicPage = request.nextUrl.pathname === '/' ||
                       request.nextUrl.pathname.startsWith('/api/') ||
                       request.nextUrl.pathname.startsWith('/fornecedor/') ||
                       request.nextUrl.pathname.startsWith('/c/')

  // Se está na página de login/cadastro E tem sessão, redirecionar para dashboard
  if (isAuthPage && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Se não tem sessão e não é página pública, redirecionar para login
  if (!session && !isAuthPage && !isPublicPage) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

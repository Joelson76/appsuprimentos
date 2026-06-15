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

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Rotas públicas (não precisam autenticação)
  const publicPaths = ['/login', '/cadastro', '/planos', '/', '/api/webhooks', '/api/test-email', '/api/debug-planos']
  const isPublicPath = publicPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  )

  // Se não está autenticado e não é rota pública, redirecionar para login
  if (!user && !isPublicPath) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Se está autenticado tentando acessar login/cadastro, redirecionar
  if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/cadastro')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Se está autenticado, validar tenant_id e assinatura
  if (user && !isPublicPath) {
    // Buscar profile do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id, perfil')
      .eq('id', user.id)
      .single()

    // Validar profile
    if (!profile || !profile.tenant_id) {
      console.error('❌ Usuário sem profile/tenant:', user.id)
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('error', 'invalid_profile')
      return NextResponse.redirect(redirectUrl)
    }

    // Adicionar headers com info do usuário (seguro, server-side only)
    supabaseResponse.headers.set('x-tenant-id', profile.tenant_id)
    supabaseResponse.headers.set('x-user-perfil', profile.perfil)
    supabaseResponse.headers.set('x-user-id', user.id)

    // Verificar assinatura (exceto super admin)
    if (profile.perfil !== 'SUPER_ADMIN') {
      const { data: assinatura } = await supabase
        .from('assinaturas')
        .select('status, trial_fim')
        .eq('tenant_id', profile.tenant_id)
        .single()

      // Se assinatura suspensa/cancelada, bloquear acesso
      if (
        assinatura &&
        (assinatura.status === 'SUSPENSA' || assinatura.status === 'CANCELADA')
      ) {
        if (!request.nextUrl.pathname.startsWith('/configuracoes/assinatura')) {
          const redirectUrl = new URL('/configuracoes/assinatura', request.url)
          redirectUrl.searchParams.set('error', 'subscription_suspended')
          return NextResponse.redirect(redirectUrl)
        }
      }

      // Se trial expirado, redirecionar para escolher plano
      if (
        assinatura &&
        assinatura.status === 'TRIAL' &&
        assinatura.trial_fim &&
        new Date(assinatura.trial_fim) < new Date()
      ) {
        if (
          !request.nextUrl.pathname.startsWith('/configuracoes/assinatura') &&
          !request.nextUrl.pathname.startsWith('/configuracoes/planos')
        ) {
          const redirectUrl = new URL('/configuracoes/planos', request.url)
          redirectUrl.searchParams.set('error', 'trial_expired')
          return NextResponse.redirect(redirectUrl)
        }
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public files (images, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

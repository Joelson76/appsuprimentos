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

  // Client service_role para queries de profile (bypass RLS)
  const supabaseAdmin = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
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
  const publicPaths = [
    '/login',
    '/cadastro',
    '/planos',
    '/',
    '/api/webhooks',
    '/api/test-email',
    '/api/debug-planos',
    '/fornecedor/', // Links de cotação para fornecedores (acesso via token)
    '/c/', // Short links de cotação (ex: /c/a3m5n9k2)
    '/api/cotacao-fornecedor', // Rota alternativa de redirecionamento
    '/api/debug-token', // Debug de tokens
  ]
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
    console.log('🔍 Middleware: Buscando profile para usuário', user.id)

    // Buscar profile do usuário usando service_role (bypass RLS)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('tenant_id, perfil')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('❌ Erro ao buscar profile:', profileError)
    }

    // Validar profile
    if (!profile || !profile.tenant_id) {
      console.error('❌ Usuário sem profile/tenant:', user.id, 'profile:', profile)
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('error', 'invalid_profile')
      return NextResponse.redirect(redirectUrl)
    }

    console.log('✅ Profile encontrado:', profile.tenant_id, profile.perfil)

    // Adicionar headers com info do usuário (seguro, server-side only)
    supabaseResponse.headers.set('x-tenant-id', profile.tenant_id)
    supabaseResponse.headers.set('x-user-perfil', profile.perfil)
    supabaseResponse.headers.set('x-user-id', user.id)

    // Verificar assinatura (exceto super admin)
    if (profile.perfil !== 'SUPER_ADMIN') {
      console.log('🔍 Middleware: Buscando assinatura para tenant', profile.tenant_id)

      const { data: assinatura, error: assinaturaError } = await supabaseAdmin
        .from('assinaturas')
        .select('status, trial_fim')
        .eq('tenant_id', profile.tenant_id)
        .single()

      if (assinaturaError) {
        console.error('❌ Erro ao buscar assinatura:', assinaturaError)
      } else {
        console.log('✅ Assinatura encontrada:', assinatura?.status)
      }

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

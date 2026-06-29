import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // 1. Verificar sessão
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()

    // 2. Verificar usuário
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    // 3. Tentar buscar profile (se tiver usuário)
    let profileInfo = null
    let profileError = null

    if (user) {
      const { data: profile, error: pError } = await supabase
        .from('profiles')
        .select('id, tenant_id, perfil, nome')
        .eq('id', user.id)
        .single()

      profileInfo = profile
      profileError = pError
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      session: {
        exists: !!session,
        expiresAt: session?.expires_at,
        hasAccessToken: !!session?.access_token,
        error: sessionError?.message || null
      },
      user: {
        exists: !!user,
        id: user?.id || null,
        email: user?.email || null,
        error: userError?.message || null
      },
      profile: {
        exists: !!profileInfo,
        tenantId: profileInfo?.tenant_id || null,
        perfil: profileInfo?.perfil || null,
        nome: profileInfo?.nome || null,
        error: profileError?.message || null,
        errorCode: profileError?.code || null
      },
      diagnosis: {
        sessionOK: !!session,
        userOK: !!user,
        profileOK: !!profileInfo,
        overallStatus: !!session && !!user && !!profileInfo ? 'ALL_OK' : 'HAS_ISSUES'
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      error: 'Internal server error',
      message: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}

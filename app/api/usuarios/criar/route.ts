import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 1. Verificar autenticação
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // 2. Buscar profile do admin usando cliente normal (RLS permite self-access)
    const { data: adminProfile, error: profileError } = await supabase
      .from('profiles')
      .select('perfil, tenant_id')
      .eq('id', user.id)
      .single()

    console.log('🔍 DEBUG adminProfile:', {
      userId: user.id,
      adminProfile,
      profileError: profileError?.message,
      hasTenantId: !!adminProfile?.tenant_id,
      tenantIdValue: adminProfile?.tenant_id
    })

    if (profileError || !adminProfile) {
      return NextResponse.json(
        {
          error: 'Erro ao buscar dados do administrador',
          details: profileError?.message,
          debug: { userId: user.id, profileError }
        },
        { status: 500 }
      )
    }

    if (!['SUPER_ADMIN', 'ADMIN'].includes(adminProfile.perfil)) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    if (!adminProfile.tenant_id) {
      console.error('❌ Admin sem tenant_id!', { adminProfile, userId: user.id })
      return NextResponse.json(
        {
          error: 'Administrador sem tenant configurado',
          debug: { adminProfile, userId: user.id }
        },
        { status: 400 }
      )
    }

    console.log('✅ tenant_id encontrado:', adminProfile.tenant_id)

    // 3. Buscar env vars para criar usuário via Admin API
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Configuração do servidor incompleta' },
        { status: 500 }
      )
    }

    // 4. Validar dados recebidos
    const { email, senha, nome, perfil: novoPerfil } = await request.json()

    if (!email || !senha || !nome || !novoPerfil) {
      return NextResponse.json(
        { error: 'Dados incompletos (email, senha, nome e perfil são obrigatórios)' },
        { status: 400 }
      )
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    }

    // Validar senha (mínimo 6 caracteres)
    if (senha.length < 6) {
      return NextResponse.json(
        { error: 'Senha deve ter no mínimo 6 caracteres' },
        { status: 400 }
      )
    }

    // Validar perfil
    const perfisValidos = ['ADMIN', 'GESTOR', 'COMPRADOR', 'SOLICITANTE', 'ALMOXARIFE', 'FINANCEIRO']
    if (!perfisValidos.includes(novoPerfil)) {
      return NextResponse.json({ error: 'Perfil inválido' }, { status: 400 })
    }

    // 4. Criar usuário via REST API do Supabase
    // IMPORTANTE: Passar tenant_id no user_metadata para o trigger handle_new_user
    const createUserResponse = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`,
        'apikey': serviceRoleKey,
      },
      body: JSON.stringify({
        email,
        password: senha,
        email_confirm: true,
        user_metadata: {
          nome,
          tenant_id: adminProfile.tenant_id,
          perfil: novoPerfil,
        },
      }),
    })

    if (!createUserResponse.ok) {
      const errorData = await createUserResponse.json()
      return NextResponse.json(
        {
          error: 'Erro ao criar usuário no Supabase Auth',
          details: errorData.msg || errorData.message || 'Erro desconhecido',
        },
        { status: createUserResponse.status }
      )
    }

    const userData = await createUserResponse.json()

    // 5. O profile JÁ FOI CRIADO pelo trigger handle_new_user automaticamente!
    console.log('✅ Usuário criado! O trigger handle_new_user criou o profile automaticamente.')

    // 6. Sucesso!
    return NextResponse.json({
      success: true,
      user: {
        id: userData.id,
        email: userData.email,
        nome,
        perfil: novoPerfil,
      },
      message: 'Usuário criado com sucesso!',
    })

  } catch (error: any) {
    console.error('Erro ao criar usuário:', error)
    return NextResponse.json(
      {
        error: 'Erro interno ao criar usuário',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

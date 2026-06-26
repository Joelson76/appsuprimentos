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

    // 2. Buscar profile do admin e validar permissão
    const { data: adminProfile, error: profileError } = await supabase
      .from('profiles')
      .select('perfil, tenant_id')
      .eq('id', user.id)
      .single()

    if (profileError || !adminProfile) {
      return NextResponse.json(
        { error: 'Erro ao buscar dados do administrador' },
        { status: 500 }
      )
    }

    if (!['SUPER_ADMIN', 'ADMIN'].includes(adminProfile.perfil)) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    if (!adminProfile.tenant_id) {
      return NextResponse.json(
        { error: 'Administrador sem tenant configurado' },
        { status: 400 }
      )
    }

    // 3. Validar dados recebidos
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

    // 4. Verificar env vars
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        { error: 'Configuração do servidor incompleta' },
        { status: 500 }
      )
    }

    // 5. Criar usuário via REST API do Supabase
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
        user_metadata: { nome },
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

    // 6. Criar profile usando service_role
    const supabaseAdmin = createServiceClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { error: insertProfileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userData.id,
        nome,
        perfil: novoPerfil,
        tenant_id: adminProfile.tenant_id,
      })

    if (insertProfileError) {
      // Rollback: deletar usuário criado
      await fetch(`${supabaseUrl}/auth/v1/admin/users/${userData.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${serviceRoleKey}`,
          'apikey': serviceRoleKey,
        },
      })

      return NextResponse.json(
        {
          error: 'Erro ao criar perfil do usuário',
          details: insertProfileError.message,
        },
        { status: 500 }
      )
    }

    // 7. Sucesso!
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

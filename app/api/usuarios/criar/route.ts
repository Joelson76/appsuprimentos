import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verificar autenticação
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Verificar se é admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('perfil, tenant_id')
      .eq('id', user.id)
      .single()

    if (!['SUPER_ADMIN', 'ADMIN'].includes(profile?.perfil || '')) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }

    const { email, senha, nome, perfil, tenant_id } = await request.json()

    if (!email || !senha || !nome || !perfil || !tenant_id) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      )
    }

    // Criar usuário no Supabase Auth usando service_role
    // IMPORTANTE: Isso deve ser feito via Supabase Edge Function em produção
    // Por enquanto, vamos simular criando apenas o profile

    // Em produção, você criaria assim:
    // const { data: newUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    //   email,
    //   password: senha,
    //   email_confirm: true,
    // })

    // Por agora, vamos apenas criar o profile (simulação)
    // O usuário precisará ser criado manualmente via Supabase Dashboard

    return NextResponse.json({
      success: false,
      error: 'Criação de usuários via API não implementada. Use o Supabase Dashboard para criar usuários.',
      message: 'Para criar novos usuários:\n1. Acesse o Supabase Dashboard\n2. Vá em Authentication > Users\n3. Clique em "Add user"\n4. Preencha email e senha\n5. Depois, atualize o perfil na tabela profiles',
    }, { status: 501 })

  } catch (error) {
    console.error('Erro ao criar usuário:', error)
    return NextResponse.json(
      { error: 'Erro ao criar usuário' },
      { status: 500 }
    )
  }
}

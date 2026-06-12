import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { plano, valor } = await request.json()

    if (!plano || !valor) {
      return NextResponse.json(
        { error: 'Plano e valor são obrigatórios' },
        { status: 400 }
      )
    }

    // Buscar tenant do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (!profile?.tenant_id) {
      return NextResponse.json(
        { error: 'Tenant não encontrado' },
        { status: 404 }
      )
    }

    // Buscar assinatura atual
    const { data: assinaturaAtual } = await supabase
      .from('assinaturas')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .single()

    // Se não existir assinatura, criar
    if (!assinaturaAtual) {
      const { error: createError } = await supabase.from('assinaturas').insert({
        tenant_id: profile.tenant_id,
        plano,
        valor_mensal: valor,
        ativa: true,
      })

      if (createError) {
        throw createError
      }
    } else {
      // Atualizar assinatura existente
      const { error: updateError } = await supabase
        .from('assinaturas')
        .update({
          plano,
          valor_mensal: valor,
        })
        .eq('id', assinaturaAtual.id)

      if (updateError) {
        throw updateError
      }
    }

    // Atualizar tenant
    const { error: tenantError } = await supabase
      .from('tenants')
      .update({
        plano,
        status: 'ATIVO',
      })
      .eq('id', profile.tenant_id)

    if (tenantError) {
      throw tenantError
    }

    return NextResponse.json({
      success: true,
      message: 'Plano alterado com sucesso',
    })
  } catch (error) {
    console.error('Erro ao mudar plano:', error)
    return NextResponse.json(
      { error: 'Erro ao alterar plano' },
      { status: 500 }
    )
  }
}

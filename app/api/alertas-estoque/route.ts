import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const statusParam = searchParams.get('status') || 'ABERTO'

    // Debug: verificar usuário autenticado
    const { data: { user } } = await supabase.auth.getUser()
    console.log('🔍 API alertas-estoque - User:', user?.id)

    if (!user) {
      console.log('❌ Usuário não autenticado!')
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Buscar tenant do usuário
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (!profile?.tenant_id) {
      console.log('❌ Tenant não encontrado para usuário:', user.id)
      return NextResponse.json({ error: 'Tenant não encontrado' }, { status: 404 })
    }

    console.log('✅ Tenant encontrado:', profile.tenant_id)

    // Buscar alertas DIRETO das tabelas (não usar view problemática)
    const { data: alertasRaw, error: alertasError } = await supabase
      .from('alertas_estoque')
      .select(`
        id,
        tipo,
        status,
        prioridade,
        estoque_atual,
        estoque_minimo,
        estoque_maximo,
        criado_em,
        produtos!inner (
          id,
          codigo,
          descricao,
          unidade,
          estoque_atual,
          estoque_minimo_alerta,
          tenant_id,
          ativo
        )
      `)
      .eq('produtos.tenant_id', profile.tenant_id)
      .eq('produtos.ativo', true)
      .in('status', ['ABERTO', 'EM_REPOSICAO'])
      .order('prioridade', { ascending: false })

    console.log('🔍 API alertas-estoque - Result:', {
      total: alertasRaw?.length,
      error: alertasError?.message,
      primeiros: alertasRaw?.slice(0, 2)
    })

    if (alertasError) {
      console.log('❌ Erro ao buscar alertas:', alertasError)
      return NextResponse.json({ error: alertasError.message }, { status: 500 })
    }

    // Transformar para o formato esperado pelo frontend
    const alertas = alertasRaw?.map((alerta: any) => ({
      id: alerta.id,
      produto_id: alerta.produtos.id,
      codigo: alerta.produtos.codigo,
      descricao: alerta.produtos.descricao,
      unidade: alerta.produtos.unidade,
      estoque_atual: alerta.produtos.estoque_atual,
      estoque_minimo_alerta: alerta.produtos.estoque_minimo_alerta,
      tipo: alerta.tipo,
      status: alerta.status,
      prioridade: alerta.prioridade,
      alerta_estoque_atual: alerta.estoque_atual,
      alerta_estoque_minimo: alerta.estoque_minimo,
      nivel_estoque: alerta.tipo === 'RUPTURA' ? 'CRÍTICO' :
                     alerta.tipo === 'ESTOQUE_MINIMO' ? 'BAIXO' : 'ALERTA'
    })) || []

    console.log('✅ Retornando', alertas.length, 'alertas')

    return NextResponse.json(alertas)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Resolver alerta
export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const { alerta_id, status, requisicao_id } = await request.json()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { error } = await supabase
      .from('alertas_estoque')
      .update({
        status,
        resolvido_em: status === 'RESOLVIDO' ? new Date().toISOString() : null,
        resolvido_por: status === 'RESOLVIDO' ? user.id : null,
        requisicao_id: requisicao_id || null
      })
      .eq('id', alerta_id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

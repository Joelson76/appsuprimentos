import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const fornecedorId = searchParams.get('fornecedor_id')
    const pedidoId = searchParams.get('pedido_id')

    let query = supabase
      .from('avaliacoes_fornecedores')
      .select(`
        *,
        fornecedor:fornecedores(razao_social),
        pedido:ordens_compra(numero),
        avaliador:profiles(nome)
      `)
      .order('avaliado_em', { ascending: false })

    if (fornecedorId) {
      query = query.eq('fornecedor_id', fornecedorId)
    }

    if (pedidoId) {
      query = query.eq('pedido_id', pedidoId)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Perfil não encontrado' }, { status: 404 })
    }

    const { data, error } = await supabase
      .from('avaliacoes_fornecedores')
      .insert({
        tenant_id: profile.tenant_id,
        fornecedor_id: body.fornecedor_id,
        pedido_id: body.pedido_id,
        nota_preco: body.nota_preco,
        nota_qualidade: body.nota_qualidade,
        nota_prazo: body.nota_prazo,
        nota_atendimento: body.nota_atendimento,
        comentarios: body.comentarios,
        problemas: body.problemas || [],
        avaliado_por: user.id
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

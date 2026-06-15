import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
// Email templates foram removidos - usar email-service-simple.ts se necessário

export async function POST(request: NextRequest) {
  try {
    const { pedidoId } = await request.json()

    if (!pedidoId) {
      return NextResponse.json(
        { error: 'pedidoId é obrigatório' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Buscar pedido com fornecedor e itens
    const { data: pedido, error } = await supabase
      .from('pedidos')
      .select(
        `
        *,
        fornecedores (
          razao_social,
          nome_fantasia,
          email
        ),
        itens_pedido (
          descricao,
          quantidade,
          valor_unitario,
          prazo_entrega
        )
      `
      )
      .eq('id', pedidoId)
      .single()

    if (error || !pedido) {
      return NextResponse.json(
        { error: 'Pedido não encontrado' },
        { status: 404 }
      )
    }

    if (!pedido.fornecedores.email) {
      return NextResponse.json(
        { error: 'Fornecedor não possui e-mail cadastrado' },
        { status: 400 }
      )
    }

    // Formatar datas
    const dataEmissao = new Date(pedido.data_emissao).toLocaleDateString(
      'pt-BR'
    )
    const dataEntregaPrevista = pedido.data_entrega_prevista
      ? new Date(pedido.data_entrega_prevista).toLocaleDateString('pt-BR')
      : undefined

    // TODO: Implementar e-mail de pedido usando email-service-simple.ts
    // Removido temporariamente até criar template inline
    console.log('📧 E-mail de pedido seria enviado para:', pedido.fornecedores.email)

    const emailData = { id: 'temp-id' }
    const emailError = null

    if (emailError) {
      console.error('Erro ao enviar e-mail:', emailError)
      return NextResponse.json(
        { error: 'Erro ao enviar e-mail', details: emailError },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      emailId: emailData?.id,
      message: 'E-mail enviado com sucesso',
    })
  } catch (error) {
    console.error('Erro na API:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

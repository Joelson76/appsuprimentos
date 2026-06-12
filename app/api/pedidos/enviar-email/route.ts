import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resend, EMAIL_FROM } from '@/lib/resend'
import { PedidoFornecedorEmail } from '@/lib/email-templates/pedido-fornecedor'

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

    // Enviar e-mail via Resend
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: EMAIL_FROM,
      to: pedido.fornecedores.email,
      subject: `Pedido de Compra ${pedido.numero}`,
      react: PedidoFornecedorEmail({
        fornecedorNome:
          pedido.fornecedores.nome_fantasia ||
          pedido.fornecedores.razao_social,
        numeroPedido: pedido.numero,
        dataEmissao,
        dataEntregaPrevista,
        condicaoPagamento: pedido.condicao_pagamento,
        itens: pedido.itens_pedido.map((item: any) => ({
          descricao: item.descricao,
          quantidade: Number(item.quantidade),
          valorUnitario: Number(item.valor_unitario),
          prazoEntrega: item.prazo_entrega,
        })),
        valorTotal: Number(pedido.valor_total),
        observacoes: pedido.observacoes,
      }),
    })

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

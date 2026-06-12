import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { nfId } = await request.json()

    if (!nfId) {
      return NextResponse.json({ error: 'nfId é obrigatório' }, { status: 400 })
    }

    const supabase = await createClient()

    // Buscar NF com pedido e recebimento
    const { data: nf, error: nfError } = await supabase
      .from('notas_fiscais')
      .select(
        `
        *,
        pedido:pedidos!notas_fiscais_pedido_id_fkey (
          valor_total,
          itens_pedido (
            descricao,
            quantidade,
            valor_unitario
          )
        ),
        recebimento:recebimentos (
          itens_recebimento (
            descricao,
            quantidade_pedida,
            quantidade_recebida,
            divergencia
          )
        )
      `
      )
      .eq('id', nfId)
      .single()

    if (nfError || !nf) {
      return NextResponse.json(
        { error: 'Nota fiscal não encontrada' },
        { status: 404 }
      )
    }

    // Realizar 3-way matching (NF x PO x Recebimento)
    const divergencias: any[] = []

    // 1. Conferir valor total (NF vs PO)
    const valorNF = Number(nf.valor_total)
    const valorPO = Number(nf.pedido.valor_total)
    const diferencaValor = Math.abs(valorNF - valorPO)

    if (diferencaValor > 0.01) {
      divergencias.push({
        tipo: 'VALOR_TOTAL',
        severidade: diferencaValor > valorPO * 0.05 ? 'ALTA' : 'BAIXA', // >5% = alta
        descricao: `Divergência de valor: NF R$ ${valorNF.toFixed(2)} vs PO R$ ${valorPO.toFixed(2)}`,
        diferenca: valorNF - valorPO,
      })
    }

    // 2. Conferir itens recebidos (se houver recebimento)
    if (nf.recebimento && nf.recebimento.itens_recebimento) {
      const itensDivergentes = nf.recebimento.itens_recebimento.filter(
        (item: any) => item.divergencia
      )

      if (itensDivergentes.length > 0) {
        divergencias.push({
          tipo: 'QUANTIDADE_RECEBIDA',
          severidade: 'MEDIA',
          descricao: `${itensDivergentes.length} item(ns) com divergência de quantidade`,
          itens: itensDivergentes.map((item: any) => ({
            descricao: item.descricao,
            pedido: item.quantidade_pedida,
            recebido: item.quantidade_recebida,
          })),
        })
      }
    }

    // 3. Determinar novo status
    let novoStatus = 'CONFERIDA'

    if (divergencias.length > 0) {
      const temDivergenciaAlta = divergencias.some(
        (d) => d.severidade === 'ALTA'
      )
      novoStatus = temDivergenciaAlta ? 'DIVERGENTE' : 'CONFERIDA'
    }

    // Atualizar NF com resultado da conferência
    const { error: updateError } = await supabase
      .from('notas_fiscais')
      .update({
        status: novoStatus,
        divergencias: divergencias.length > 0 ? divergencias : null,
      })
      .eq('id', nfId)

    if (updateError) throw updateError

    return NextResponse.json({
      success: true,
      status: novoStatus,
      divergencias,
      message:
        divergencias.length === 0
          ? 'Conferência concluída: NF-e está conforme!'
          : `Conferência concluída: ${divergencias.length} divergência(s) encontrada(s)`,
    })
  } catch (error: any) {
    console.error('Erro na API de conferência:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

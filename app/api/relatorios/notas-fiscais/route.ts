import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const dataInicio = searchParams.get('dataInicio')
    const dataFim = searchParams.get('dataFim')

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    // Buscar NFs do período
    let query = supabase
      .from('notas_fiscais')
      .select(
        `
        *,
        ordens_compra (
          numero,
          fornecedores (
            razao_social,
            cnpj
          )
        )
      `
      )
      .order('emissao', { ascending: false })

    if (dataInicio) {
      query = query.gte('emissao', dataInicio)
    }

    if (dataFim) {
      query = query.lte('emissao', dataFim)
    }

    const { data: notasFiscais, error } = await query

    if (error) {
      console.error('Erro ao buscar NFs:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar notas fiscais' },
        { status: 500 }
      )
    }

    // Gerar CSV
    const headers = [
      'Número NF',
      'Série',
      'Chave de Acesso',
      'Data Emissão',
      'CNPJ Fornecedor',
      'Razão Social Fornecedor',
      'Valor Total',
      'Número PO',
      'Status',
      'Data Cadastro',
    ]

    const rows = notasFiscais.map((nf: any) => [
      nf.numero,
      nf.serie || '',
      nf.chave_acesso || '',
      nf.emissao,
      nf.ordens_compra?.fornecedores?.cnpj || '',
      nf.ordens_compra?.fornecedores?.razao_social || '',
      nf.valor_total.toFixed(2).replace('.', ','),
      nf.ordens_compra?.numero || '',
      nf.status,
      new Date(nf.criado_em).toLocaleDateString('pt-BR'),
    ])

    const csvContent = [
      headers.join(';'),
      ...rows.map((row) => row.join(';')),
    ].join('\n')

    // Adicionar BOM para UTF-8 (Excel reconhece)
    const bom = '﻿'
    const csvWithBom = bom + csvContent

    const periodo = dataInicio && dataFim
      ? `${dataInicio}_${dataFim}`
      : new Date().toISOString().split('T')[0]

    return new Response(csvWithBom, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="notas-fiscais-${periodo}.csv"`,
      },
    })
  } catch (error) {
    console.error('Erro ao gerar relatório:', error)
    return NextResponse.json(
      { error: 'Erro ao gerar relatório' },
      { status: 500 }
    )
  }
}

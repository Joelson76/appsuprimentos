// Edge Function para gerar relatórios em CSV/Excel
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers':
          'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const { tipo, formato, filtros, tenantId } = await req.json()

    if (!tipo || !formato || !tenantId) {
      return new Response(
        JSON.stringify({ error: 'Parâmetros incompletos' }),
        { status: 400 }
      )
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    let query: any
    let headers: string[]
    let titulo = ''

    // Montar query baseado no tipo
    switch (tipo) {
      case 'compras':
        titulo = 'Relatório de Compras'
        query = supabaseAdmin
          .from('ordens_compra')
          .select(
            `
            numero,
            criado_em,
            valor_total,
            status,
            fornecedores (razao_social, cnpj)
          `
          )
          .eq('tenant_id', tenantId)
          .order('criado_em', { ascending: false })

        if (filtros?.startDate) {
          query = query.gte('criado_em', filtros.startDate)
        }
        if (filtros?.endDate) {
          query = query.lte('criado_em', filtros.endDate)
        }
        if (filtros?.fornecedorId) {
          query = query.eq('fornecedor_id', filtros.fornecedorId)
        }

        headers = [
          'Número PO',
          'Data',
          'Fornecedor',
          'CNPJ',
          'Valor Total',
          'Status',
        ]
        break

      case 'por-fornecedor':
        titulo = 'Relatório por Fornecedor'
        query = supabaseAdmin.rpc('relatorio_por_fornecedor', {
          p_tenant_id: tenantId,
          p_start_date: filtros?.startDate,
          p_end_date: filtros?.endDate,
        })
        headers = ['Fornecedor', 'Total de POs', 'Valor Total', 'Ticket Médio']
        break

      case 'estoque':
        titulo = 'Relatório de Estoque'
        query = supabaseAdmin
          .from('produtos')
          .select('descricao, codigo, estoque_atual, estoque_minimo_alerta, unidade')
          .eq('tenant_id', tenantId)
          .eq('ativo', true)
          .order('descricao')

        headers = [
          'Descrição',
          'Código',
          'Estoque Atual',
          'Estoque Mínimo',
          'Unidade',
        ]
        break

      default:
        return new Response(
          JSON.stringify({ error: 'Tipo de relatório inválido' }),
          { status: 400 }
        )
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro na query:', error)
      return new Response(
        JSON.stringify({ error: 'Erro ao buscar dados' }),
        { status: 500 }
      )
    }

    // Gerar CSV
    if (formato === 'csv' || formato === 'excel') {
      const rows = data.map((item: any) => {
        switch (tipo) {
          case 'compras':
            return [
              item.numero,
              new Date(item.criado_em).toLocaleDateString('pt-BR'),
              item.fornecedores?.razao_social || '',
              item.fornecedores?.cnpj || '',
              item.valor_total.toFixed(2).replace('.', ','),
              item.status,
            ]
          case 'estoque':
            return [
              item.descricao,
              item.codigo || '',
              item.estoque_atual.toString().replace('.', ','),
              item.estoque_minimo_alerta?.toString().replace('.', ',') || '',
              item.unidade,
            ]
          default:
            return Object.values(item)
        }
      })

      const csvContent = [headers.join(';'), ...rows.map((r) => r.join(';'))].join(
        '\n'
      )

      // BOM para UTF-8
      const bom = '﻿'
      const csvWithBom = bom + csvContent

      // Upload no Storage
      const timestamp = Date.now()
      const fileName = `${tenantId}/relatorios/${timestamp}-${tipo}.csv`

      const { error: uploadError } = await supabaseAdmin.storage
        .from('documentos')
        .upload(fileName, new TextEncoder().encode(csvWithBom), {
          contentType: 'text/csv; charset=utf-8',
          upsert: false,
        })

      if (uploadError) {
        console.error('Erro no upload:', uploadError)
        return new Response(
          JSON.stringify({ error: 'Erro ao salvar relatório' }),
          { status: 500 }
        )
      }

      // Gerar URL assinada
      const { data: signedUrl } = await supabaseAdmin.storage
        .from('documentos')
        .createSignedUrl(fileName, 3600)

      return new Response(
        JSON.stringify({
          success: true,
          url: signedUrl?.signedUrl,
          fileName: `${tipo}-${timestamp}.csv`,
          registros: data.length,
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Formato não suportado' }),
      { status: 400 }
    )
  } catch (error) {
    console.error('Erro ao gerar relatório:', error)
    return new Response(
      JSON.stringify({ error: 'Erro ao gerar relatório' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
})

// Edge Function para gerar PDF da Ordem de Compra
// Usa jsPDF para geração e upload no Supabase Storage

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const { pedidoId } = await req.json()

    if (!pedidoId) {
      return new Response(
        JSON.stringify({ error: 'pedidoId não informado' }),
        { status: 400 }
      )
    }

    // Cliente Supabase com service_role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Buscar dados da PO
    const { data: po, error: poError } = await supabaseAdmin
      .from('ordens_compra')
      .select(
        `
        *,
        fornecedores (*),
        tenants (*),
        itens_po (*)
      `
      )
      .eq('id', pedidoId)
      .single()

    if (poError || !po) {
      return new Response(
        JSON.stringify({ error: 'Pedido não encontrado' }),
        { status: 404 }
      )
    }

    // Gerar PDF (versão simplificada - em produção usar biblioteca como jsPDF)
    const pdfContent = `
ORDEM DE COMPRA: ${po.numero}
=====================================

FORNECEDOR:
${po.fornecedores.razao_social}
CNPJ: ${po.fornecedores.cnpj}

EMPRESA:
${po.tenants.nome}

ITENS:
${po.itens_po
  .map(
    (item: any, i: number) =>
      `${i + 1}. ${item.descricao} - ${item.quantidade} ${item.unidade} x R$ ${item.valor_unitario} = R$ ${item.valor_total}`
  )
  .join('\n')}

VALOR TOTAL: R$ ${po.valor_total}
PRAZO DE ENTREGA: ${po.prazo_entrega || 'A definir'}
CONDIÇÃO DE PAGAMENTO: ${po.condicao_pagamento || 'A combinar'}

Observações:
${po.observacoes || '-'}
    `.trim()

    // Converter para Blob/Buffer (simplificado)
    const pdfBlob = new TextEncoder().encode(pdfContent)

    // Upload no Storage
    const fileName = `po/${po.tenant_id}/${po.numero}.txt`
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('documentos')
      .upload(fileName, pdfBlob, {
        contentType: 'text/plain',
        upsert: true,
      })

    if (uploadError) {
      console.error('Erro ao fazer upload:', uploadError)
      return new Response(
        JSON.stringify({ error: 'Erro ao salvar PDF' }),
        { status: 500 }
      )
    }

    // Gerar URL assinada (válida por 1 hora)
    const { data: signedUrl } = await supabaseAdmin.storage
      .from('documentos')
      .createSignedUrl(fileName, 3600)

    return new Response(
      JSON.stringify({
        success: true,
        url: signedUrl?.signedUrl,
        path: fileName,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  } catch (error) {
    console.error('Erro ao gerar PDF:', error)
    return new Response(
      JSON.stringify({ error: 'Erro ao gerar PDF' }),
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

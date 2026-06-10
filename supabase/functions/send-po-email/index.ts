// Edge Function para enviar PO por e-mail via Resend

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

    if (!po.fornecedores.email) {
      return new Response(
        JSON.stringify({ error: 'Fornecedor não possui e-mail cadastrado' }),
        { status: 400 }
      )
    }

    // Enviar e-mail via Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const emailFrom = Deno.env.get('EMAIL_FROM') || 'noreply@supriflow.com.br'

    if (!resendApiKey) {
      console.warn('RESEND_API_KEY não configurado')
      return new Response(
        JSON.stringify({
          success: true,
          message: 'E-mail não enviado (RESEND_API_KEY não configurado)',
        }),
        { status: 200 }
      )
    }

    const itensHtml = po.itens_po
      .map(
        (item: any, i: number) => `
        <tr>
          <td>${i + 1}</td>
          <td>${item.descricao}</td>
          <td>${item.quantidade} ${item.unidade}</td>
          <td>R$ ${Number(item.valor_unitario).toFixed(2)}</td>
          <td>R$ ${Number(item.valor_total).toFixed(2)}</td>
        </tr>
      `
      )
      .join('')

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background-color: #f4f4f4; }
          .header { background-color: #3b82f6; color: white; padding: 20px; }
          .total { font-size: 1.2em; font-weight: bold; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Ordem de Compra: ${po.numero}</h1>
        </div>

        <h2>Prezado ${po.fornecedores.razao_social},</h2>
        <p>Segue em anexo nossa Ordem de Compra ${po.numero}.</p>

        <h3>Dados da Empresa:</h3>
        <p><strong>${po.tenants.nome}</strong><br>
        CNPJ: ${po.tenants.cnpj}</p>

        <h3>Itens:</h3>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Descrição</th>
              <th>Quantidade</th>
              <th>Valor Unit.</th>
              <th>Valor Total</th>
            </tr>
          </thead>
          <tbody>
            ${itensHtml}
          </tbody>
        </table>

        <div class="total">
          Valor Total: R$ ${Number(po.valor_total).toFixed(2)}
        </div>

        <p><strong>Prazo de Entrega:</strong> ${po.prazo_entrega || 'A definir'}</p>
        <p><strong>Condição de Pagamento:</strong> ${po.condicao_pagamento || 'A combinar'}</p>

        ${po.observacoes ? `<p><strong>Observações:</strong><br>${po.observacoes}</p>` : ''}

        <p>Por favor, confirme o recebimento desta ordem de compra.</p>

        <p>Atenciosamente,<br>
        <strong>${po.tenants.nome}</strong></p>
      </body>
      </html>
    `

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: emailFrom,
        to: po.fornecedores.email,
        subject: `Ordem de Compra ${po.numero} - ${po.tenants.nome}`,
        html: htmlContent,
      }),
    })

    const resendData = await resendResponse.json()

    if (!resendResponse.ok) {
      console.error('Erro no Resend:', resendData)
      return new Response(
        JSON.stringify({ error: 'Erro ao enviar e-mail' }),
        { status: 500 }
      )
    }

    // Atualizar status da PO
    await supabaseAdmin
      .from('ordens_compra')
      .update({ status: 'ENVIADA_FORNECEDOR' })
      .eq('id', pedidoId)

    return new Response(
      JSON.stringify({
        success: true,
        messageId: resendData.id,
        message: 'E-mail enviado com sucesso',
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  } catch (error) {
    console.error('Erro ao enviar e-mail:', error)
    return new Response(
      JSON.stringify({ error: 'Erro ao enviar e-mail' }),
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

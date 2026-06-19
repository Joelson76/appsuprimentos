import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { pedidoId } = await request.json()

    if (!pedidoId) {
      return NextResponse.json(
        { error: 'ID do pedido não informado' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verificar autenticação
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Buscar pedido com fornecedor e itens
    const { data: pedido, error } = await supabase
      .from('pedidos')
      .select(
        `
        *,
        fornecedor:fornecedores!inner(razao_social, nome_fantasia, email, cnpj),
        itens_pedido(*)
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

    if (!pedido.fornecedor?.email) {
      return NextResponse.json(
        { error: 'Fornecedor não tem email cadastrado' },
        { status: 400 }
      )
    }

    // Buscar dados da empresa
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id, tenants(nome_fantasia, razao_social, cnpj, telefone, email)')
      .eq('id', user.id)
      .single()

    const empresa = profile?.tenants as any
    const nomeEmpresa = empresa?.nome_fantasia || empresa?.razao_social || 'Nossa Empresa'

    // Calcular valor total
    const valorTotal = pedido.itens_pedido.reduce(
      (sum: number, item: any) => sum + item.valor_unitario * item.quantidade,
      0
    )

    // Formatar itens HTML
    const itensHTML = pedido.itens_pedido
      .map((item: any, idx: number) => `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px 8px;">${idx + 1}</td>
          <td style="padding: 12px 8px;">${item.descricao}</td>
          <td style="padding: 12px 8px; text-align: center;">${item.quantidade}</td>
          <td style="padding: 12px 8px; text-align: right;">R$ ${Number(item.valor_unitario).toFixed(2)}</td>
          <td style="padding: 12px 8px; text-align: right; font-weight: 600;">R$ ${(item.valor_unitario * item.quantidade).toFixed(2)}</td>
        </tr>
      `)
      .join('')

    // Enviar email
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@supriflow.com.br',
      to: pedido.fornecedor.email,
      subject: `Pedido de Compra #${pedido.numero || pedido.id.substring(0, 8)} - ${nomeEmpresa}`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 800px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
      <h1 style="margin: 0;">📦 Pedido de Compra</h1>
      <p style="margin: 10px 0 0 0;">#${pedido.numero || pedido.id.substring(0, 8)}</p>
    </div>
    <div style="background: #f9fafb; padding: 30px;">
      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
        <strong>⚠️ Este é um Pedido de Compra oficial</strong><br>
        Por favor, confirme o recebimento e informe o prazo de entrega.
      </div>
      <div style="background: white; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #667eea;">Comprador</h3>
        <p style="margin: 5px 0;"><strong>${nomeEmpresa}</strong></p>
        ${empresa?.cnpj ? `<p style="margin: 5px 0;">CNPJ: ${empresa.cnpj}</p>` : ''}
      </div>
      <table style="width: 100%; border-collapse: collapse; background: white; margin: 20px 0;">
        <thead>
          <tr>
            <th style="background: #667eea; color: white; padding: 12px 8px; text-align: left;">#</th>
            <th style="background: #667eea; color: white; padding: 12px 8px; text-align: left;">Descrição</th>
            <th style="background: #667eea; color: white; padding: 12px 8px; text-align: center;">Qtd</th>
            <th style="background: #667eea; color: white; padding: 12px 8px; text-align: right;">Valor Unit.</th>
            <th style="background: #667eea; color: white; padding: 12px 8px; text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itensHTML}
          <tr style="background: #f3f4f6; font-weight: 700;">
            <td colspan="4" style="text-align: right; padding: 16px 8px;">TOTAL:</td>
            <td style="text-align: right; padding: 16px 8px; color: #667eea;">R$ ${valorTotal.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</body>
</html>
      `,
    })

    return NextResponse.json({
      success: true,
      message: `E-mail enviado para ${pedido.fornecedor.email}`,
    })
  } catch (error: any) {
    console.error('Erro ao enviar email:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao enviar email' },
      { status: 500 }
    )
  }
}

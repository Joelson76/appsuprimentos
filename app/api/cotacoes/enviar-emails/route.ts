import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { cotacaoId, fornecedores } = await request.json()

    if (!cotacaoId || !fornecedores || fornecedores.length === 0) {
      return NextResponse.json(
        { error: 'Dados inválidos' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Verificar autenticação
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    // Buscar dados da cotação
    const { data: cotacao } = await supabase
      .from('cotacoes')
      .select('numero, prazo_resposta, descricao')
      .eq('id', cotacaoId)
      .single()

    if (!cotacao) {
      return NextResponse.json(
        { error: 'Cotação não encontrada' },
        { status: 404 }
      )
    }

    // Buscar dados da empresa (tenant)
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id, tenants(nome_fantasia, razao_social)')
      .eq('id', user.id)
      .single()

    const nomeEmpresa =
      (profile?.tenants as any)?.nome_fantasia ||
      (profile?.tenants as any)?.razao_social ||
      'Nossa Empresa'

    const emailsEnviados: string[] = []
    const erros: string[] = []

    // Enviar email para cada fornecedor
    for (const fornecedor of fornecedores) {
      if (!fornecedor.email) {
        erros.push(`${fornecedor.nome}: sem email cadastrado`)
        continue
      }

      if (!fornecedor.link) {
        erros.push(`${fornecedor.nome}: link não gerado`)
        continue
      }

      try {
        const prazoTexto = cotacao.prazo_resposta
          ? new Date(cotacao.prazo_resposta).toLocaleDateString('pt-BR')
          : 'conforme solicitação'

        await resend.emails.send({
          from: process.env.EMAIL_FROM || 'noreply@supriflow.com.br',
          to: fornecedor.email,
          subject: `Solicitação de Cotação #${cotacao.numero} - ${nomeEmpresa}`,
          html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #667eea; color: white !important; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
    .info-box { background: white; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">📋 Solicitação de Cotação</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Cotação #${cotacao.numero}</p>
    </div>

    <div class="content">
      <p>Prezado(a) Fornecedor,</p>

      <p><strong>${nomeEmpresa}</strong> solicita sua cotação para os itens listados abaixo.</p>

      <div class="info-box">
        <strong>📅 Prazo para resposta:</strong> ${prazoTexto}
      </div>

      ${cotacao.descricao ? `<p><strong>Descrição:</strong><br>${cotacao.descricao}</p>` : ''}

      <p>Para visualizar os itens e enviar sua proposta, clique no botão abaixo:</p>

      <div style="text-align: center;">
        <a href="${fornecedor.link}" class="button">
          Acessar Cotação e Enviar Proposta
        </a>
      </div>

      <p style="font-size: 14px; color: #6b7280;">
        <strong>Importante:</strong> Este link é único e exclusivo para sua empresa.
        Por favor, não compartilhe com terceiros.
      </p>

      <div class="footer">
        <p>Esta é uma mensagem automática do sistema SupriFlow.<br>
        Em caso de dúvidas, entre em contato com ${nomeEmpresa}.</p>
      </div>
    </div>
  </div>
</body>
</html>
          `,
        })

        emailsEnviados.push(fornecedor.email)
      } catch (error: any) {
        console.error(`Erro ao enviar email para ${fornecedor.email}:`, error)
        erros.push(`${fornecedor.nome}: ${error.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      emailsEnviados: emailsEnviados.length,
      total: fornecedores.length,
      erros: erros.length > 0 ? erros : undefined,
    })
  } catch (error: any) {
    console.error('Erro ao enviar emails:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao enviar emails' },
      { status: 500 }
    )
  }
}

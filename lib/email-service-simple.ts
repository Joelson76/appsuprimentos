import { Resend } from 'resend'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const EMAIL_FROM = process.env.EMAIL_FROM || 'SupriFlow <noreply@supriflow.com.br>'

if (!RESEND_API_KEY) {
  console.warn('⚠️ RESEND_API_KEY não configurada - e-mails não serão enviados')
}

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null

export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Envia e-mail usando Resend
 */
async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<EmailResult> {
  if (!resend) {
    console.error('Resend não configurado. Configure RESEND_API_KEY')
    return {
      success: false,
      error: 'Serviço de e-mail não configurado',
    }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: [to],
      subject,
      html,
    })

    if (error) {
      console.error('Erro ao enviar e-mail:', error)
      return {
        success: false,
        error: error.message || 'Erro ao enviar e-mail',
      }
    }

    console.log('✅ E-mail enviado:', data?.id)
    return {
      success: true,
      messageId: data?.id,
    }
  } catch (error: any) {
    console.error('Erro ao enviar e-mail:', error)
    return {
      success: false,
      error: error.message || 'Erro desconhecido',
    }
  }
}

function gerarHtmlBase(titulo: string, conteudo: string): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
          ${conteudo}
        </div>
      </body>
    </html>
  `
}

/**
 * Envia e-mail de trial expirando
 */
export async function sendTrialExpirandoEmail(
  email: string,
  nomeEmpresa: string,
  diasRestantes: number,
  linkAssinatura: string
): Promise<EmailResult> {
  const html = gerarHtmlBase('Trial Expirando', `
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px;">⏰ Seu Trial está Terminando</h1>
    </div>
    <div style="padding: 40px;">
      <p>Olá, equipe <strong>${nomeEmpresa}</strong>!</p>

      <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 4px;">
        <p style="font-weight: 600; color: #92400e; margin: 0 0 8px 0;">
          ⚠️ Restam apenas ${diasRestantes} ${diasRestantes === 1 ? 'dia' : 'dias'} no seu período trial
        </p>
        <p style="margin: 0; color: #92400e;">
          Após este período, o acesso ao sistema será suspenso até que você escolha um plano.
        </p>
      </div>

      <p>
        Durante o trial, você teve acesso completo ao <strong>SupriFlow</strong> para
        gerenciar suas compras e suprimentos. Esperamos que tenha gostado da experiência!
      </p>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${linkAssinatura}" style="background: #667eea; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
          Escolher Plano Agora
        </a>
      </div>
    </div>
    <div style="text-align: center; padding: 24px; color: #6b7280; font-size: 14px;">
      <p><strong>SupriFlow</strong><br>Sistema de Gestão de Compras e Suprimentos</p>
    </div>
  `)

  return sendEmail(
    email,
    `⏰ Seu trial expira em ${diasRestantes} ${diasRestantes === 1 ? 'dia' : 'dias'}`,
    html
  )
}

/**
 * Envia e-mail de pagamento confirmado
 */
export async function sendPagamentoConfirmadoEmail(
  email: string,
  nomeEmpresa: string,
  nomePlano: string,
  valor: number,
  dataProximaCobranca: string,
  linkRecibo: string
): Promise<EmailResult> {
  const html = gerarHtmlBase('Pagamento Confirmado', `
    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px;">✅ Pagamento Confirmado!</h1>
    </div>
    <div style="padding: 40px;">
      <p>Olá, equipe <strong>${nomeEmpresa}</strong>!</p>

      <div style="background: #d1fae5; border-left: 4px solid #10b981; padding: 20px; margin: 24px 0; border-radius: 4px; text-align: center;">
        <div style="font-size: 48px; margin-bottom: 8px;">🎉</div>
        <p style="margin: 0; color: #065f46; font-size: 18px; font-weight: 600;">
          Seu pagamento foi confirmado com sucesso!
        </p>
      </div>

      <p>
        Recebemos o pagamento da sua assinatura do plano <strong>${nomePlano}</strong>.
        Seu acesso está garantido por mais um mês!
      </p>

      <table style="width: 100%; margin: 24px 0; border-collapse: collapse;">
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px; color: #6b7280; font-weight: 500;">Plano</td>
          <td style="padding: 12px; text-align: right; font-weight: 600;">${nomePlano}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px; color: #6b7280; font-weight: 500;">Valor Pago</td>
          <td style="padding: 12px; text-align: right; font-weight: 600;">R$ ${(valor / 100).toFixed(2)}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px; color: #6b7280; font-weight: 500;">Próxima Cobrança</td>
          <td style="padding: 12px; text-align: right; font-weight: 600;">${dataProximaCobranca}</td>
        </tr>
      </table>

      <div style="text-align: center;">
        <a href="${linkRecibo}" style="background: #10b981; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
          Ver Recibo
        </a>
      </div>
    </div>
    <div style="text-align: center; padding: 24px; color: #6b7280; font-size: 14px;">
      <p><strong>SupriFlow</strong><br>Sistema de Gestão de Compras e Suprimentos</p>
    </div>
  `)

  return sendEmail(email, '✅ Pagamento Confirmado - SupriFlow', html)
}

/**
 * Envia e-mail de pagamento vencido
 */
export async function sendPagamentoVencidoEmail(
  email: string,
  nomeEmpresa: string,
  valor: number,
  dataVencimento: string,
  linkPagamento: string
): Promise<EmailResult> {
  const html = gerarHtmlBase('Pagamento Vencido', `
    <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px;">⚠️ Pagamento Vencido</h1>
    </div>
    <div style="padding: 40px;">
      <p>Olá, equipe <strong>${nomeEmpresa}</strong>!</p>

      <div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 20px; margin: 24px 0; border-radius: 4px;">
        <p style="font-weight: 600; color: #991b1b; margin: 0 0 8px 0; font-size: 18px;">
          Identificamos um pagamento pendente
        </p>
        <p style="margin: 0; color: #991b1b;">
          O pagamento da sua assinatura venceu em ${dataVencimento} e ainda não foi identificado.
        </p>
      </div>

      <p>
        Para evitar a suspensão do seu acesso ao <strong>SupriFlow</strong>, por favor
        regularize seu pagamento o quanto antes.
      </p>

      <div style="background: #f9fafb; padding: 20px; border-radius: 6px; margin: 24px 0;">
        <table style="width: 100%;">
          <tr>
            <td style="color: #6b7280;">Valor:</td>
            <td style="text-align: right; font-weight: 600; font-size: 20px;">
              R$ ${(valor / 100).toFixed(2)}
            </td>
          </tr>
          <tr>
            <td style="color: #6b7280;">Vencimento:</td>
            <td style="text-align: right; font-weight: 600;">${dataVencimento}</td>
          </tr>
        </table>
      </div>

      <div style="text-align: center;">
        <a href="${linkPagamento}" style="background: #ef4444; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
          Pagar Agora
        </a>
      </div>

      <div style="background: #fffbeb; border: 1px solid #fbbf24; padding: 16px; border-radius: 6px; margin-top: 24px;">
        <p style="margin: 0; font-size: 14px; color: #92400e;">
          <strong>⏰ Atenção:</strong> Caso o pagamento não seja efetuado em até 3 dias,
          o acesso ao sistema será temporariamente suspenso até a regularização.
        </p>
      </div>
    </div>
    <div style="text-align: center; padding: 24px; color: #6b7280; font-size: 14px;">
      <p><strong>SupriFlow</strong><br>Sistema de Gestão de Compras e Suprimentos</p>
    </div>
  `)

  return sendEmail(email, '⚠️ Pagamento Vencido - Ação Necessária', html)
}

/**
 * Envia e-mail de assinatura ativada
 */
export async function sendAssinaturaAtivadaEmail(
  email: string,
  nomeEmpresa: string,
  nomePlano: string,
  linkDashboard: string
): Promise<EmailResult> {
  const html = gerarHtmlBase('Bem-vindo', `
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Bem-vindo ao SupriFlow!</h1>
    </div>
    <div style="padding: 40px;">
      <p>Olá, equipe <strong>${nomeEmpresa}</strong>!</p>

      <div style="background: linear-gradient(135deg, #e0e7ff 0%, #ddd6fe 100%); padding: 32px; margin: 24px 0; text-align: center; border-radius: 8px;">
        <div style="font-size: 64px; margin-bottom: 16px;">🚀</div>
        <h2 style="margin: 0 0 8px 0; color: #5b21b6;">Assinatura Ativada!</h2>
        <p style="margin: 0; color: #6b21a8; font-size: 18px;">
          Plano <strong>${nomePlano}</strong>
        </p>
      </div>

      <p>
        Parabéns! Sua assinatura foi ativada com sucesso e agora você tem acesso completo
        ao <strong>SupriFlow</strong> para transformar a gestão de compras e suprimentos
        da sua empresa.
      </p>

      <h3>O que você pode fazer agora:</h3>

      <ul style="list-style: none; padding: 0;">
        <li style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">✓ Criar e gerenciar requisições de compra</li>
        <li style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">✓ Enviar cotações para fornecedores</li>
        <li style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">✓ Aprovar pedidos de compra</li>
        <li style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">✓ Controlar estoque e movimentações</li>
        <li style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">✓ Gerenciar contratos com fornecedores</li>
      </ul>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${linkDashboard}" style="background: #667eea; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
          Acessar Meu Dashboard
        </a>
      </div>

      <div style="background: #eff6ff; border: 1px solid #3b82f6; padding: 20px; border-radius: 6px; margin-top: 32px;">
        <p style="margin: 0 0 8px 0; font-weight: 600; color: #1e40af;">
          💡 Precisa de Ajuda?
        </p>
        <p style="margin: 0; font-size: 14px; color: #1e40af;">
          Entre em contato com nosso suporte respondendo este e-mail. Estamos aqui para ajudar!
        </p>
      </div>
    </div>
    <div style="text-align: center; padding: 24px; color: #6b7280; font-size: 14px;">
      <p><strong>SupriFlow</strong><br>Sistema de Gestão de Compras e Suprimentos</p>
      <p style="margin-top: 16px;">Obrigado por escolher o SupriFlow! 💜</p>
    </div>
  `)

  return sendEmail(email, '🎉 Bem-vindo ao SupriFlow!', html)
}

/**
 * Envia e-mail com retry automático
 */
export async function sendEmailWithRetry(
  sendFunction: () => Promise<EmailResult>,
  maxRetries = 3
): Promise<EmailResult> {
  let lastError: string = ''

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await sendFunction()

    if (result.success) {
      return result
    }

    lastError = result.error || 'Erro desconhecido'

    if (attempt < maxRetries) {
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, attempt) * 1000)
      )
      console.log(`🔄 Tentativa ${attempt + 1}/${maxRetries}...`)
    }
  }

  return {
    success: false,
    error: `Falhou após ${maxRetries} tentativas: ${lastError}`,
  }
}

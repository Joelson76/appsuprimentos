import { Resend } from 'resend'
import { render } from '@react-email/render'
import { createElement } from 'react'

// Templates
import TrialExpirandoEmail from './email-templates/trial-expirando'
import PagamentoConfirmadoEmail from './email-templates/pagamento-confirmado'
import PagamentoVencidoEmail from './email-templates/pagamento-vencido'
import AssinaturaAtivadaEmail from './email-templates/assinatura-ativada'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const EMAIL_FROM = process.env.EMAIL_FROM || 'SupriFlow <noreply@supriflow.com.br>'

if (!RESEND_API_KEY) {
  console.warn('⚠️ RESEND_API_KEY não configurada - e-mails não serão enviados')
}

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null

export interface EmailOptions {
  to: string | string[]
  subject: string
  template: any
  props: any
}

export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Envia e-mail usando Resend
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  if (!resend) {
    console.error('Resend não configurado. Configure RESEND_API_KEY')
    return {
      success: false,
      error: 'Serviço de e-mail não configurado',
    }
  }

  try {
    // Renderizar template React para HTML
    const htmlContent = render(
      createElement(options.template, options.props)
    )

    // Enviar e-mail
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: htmlContent,
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

/**
 * Envia e-mail de trial expirando
 */
export async function sendTrialExpirandoEmail(
  email: string,
  nomeEmpresa: string,
  diasRestantes: number,
  linkAssinatura: string
): Promise<EmailResult> {
  return sendEmail({
    to: email,
    subject: `⏰ Seu trial expira em ${diasRestantes} ${diasRestantes === 1 ? 'dia' : 'dias'}`,
    template: TrialExpirandoEmail,
    props: {
      nomeEmpresa,
      diasRestantes,
      linkAssinatura,
    },
  })
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
  return sendEmail({
    to: email,
    subject: '✅ Pagamento Confirmado - SupriFlow',
    template: PagamentoConfirmadoEmail,
    props: {
      nomeEmpresa,
      nomePlano,
      valor,
      dataProximaCobranca,
      linkRecibo,
    },
  })
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
  return sendEmail({
    to: email,
    subject: '⚠️ Pagamento Vencido - Ação Necessária',
    template: PagamentoVencidoEmail,
    props: {
      nomeEmpresa,
      valor,
      dataVencimento,
      linkPagamento,
    },
  })
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
  return sendEmail({
    to: email,
    subject: '🎉 Bem-vindo ao SupriFlow!',
    template: AssinaturaAtivadaEmail,
    props: {
      nomeEmpresa,
      nomePlano,
      linkDashboard,
    },
  })
}

/**
 * Envia e-mail com retry automático
 */
export async function sendEmailWithRetry(
  options: EmailOptions,
  maxRetries = 3
): Promise<EmailResult> {
  let lastError: string = ''

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await sendEmail(options)

    if (result.success) {
      return result
    }

    lastError = result.error || 'Erro desconhecido'

    if (attempt < maxRetries) {
      // Aguardar antes de tentar novamente (backoff exponencial)
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

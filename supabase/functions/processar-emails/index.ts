import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const EMAIL_FROM = Deno.env.get('EMAIL_FROM') || 'SupriFlow <noreply@supriflow.com.br>'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

serve(async (req) => {
  try {
    console.log('🔄 Processando fila de e-mails...')

    // Buscar notificações pendentes (máximo 10 por vez)
    const { data: notificacoes, error: fetchError } = await supabase
      .from('notificacoes_pendentes')
      .select('*')
      .eq('enviado', false)
      .lt('tentativas', 3)
      .order('criado_em', { ascending: true })
      .limit(10)

    if (fetchError) {
      console.error('Erro ao buscar notificações:', fetchError)
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500,
      })
    }

    if (!notificacoes || notificacoes.length === 0) {
      console.log('✅ Nenhuma notificação pendente')
      return new Response(JSON.stringify({ message: 'Nenhuma notificação pendente' }), {
        status: 200,
      })
    }

    console.log(`📧 Processando ${notificacoes.length} notificações...`)

    const results = []

    for (const notificacao of notificacoes) {
      try {
        // Buscar dados do tenant
        const { data: tenant } = await supabase
          .from('tenants')
          .select('razao_social, email')
          .eq('id', notificacao.tenant_id)
          .single()

        if (!tenant || !tenant.email) {
          console.error(`Tenant sem e-mail: ${notificacao.tenant_id}`)
          continue
        }

        // Enviar e-mail via Resend
        const emailResult = await enviarEmail(
          tenant.email,
          tenant.razao_social,
          notificacao.tipo,
          notificacao.payload
        )

        if (emailResult.success) {
          // Marcar como enviada
          await supabase
            .from('notificacoes_pendentes')
            .update({
              enviado: true,
              enviado_em: new Date().toISOString(),
            })
            .eq('id', notificacao.id)

          results.push({ id: notificacao.id, status: 'success' })
          console.log(`✅ E-mail enviado: ${notificacao.id}`)
        } else {
          // Incrementar tentativas e salvar erro
          await supabase
            .from('notificacoes_pendentes')
            .update({
              tentativas: notificacao.tentativas + 1,
              erro: emailResult.error,
            })
            .eq('id', notificacao.id)

          results.push({ id: notificacao.id, status: 'retry', error: emailResult.error })
          console.error(`❌ Erro ao enviar: ${emailResult.error}`)
        }
      } catch (error: any) {
        console.error(`Erro ao processar notificação ${notificacao.id}:`, error)
        results.push({ id: notificacao.id, status: 'error', error: error.message })
      }
    }

    return new Response(
      JSON.stringify({
        processed: notificacoes.length,
        results,
      }),
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Erro geral:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    })
  }
})

async function enviarEmail(
  to: string,
  nomeEmpresa: string,
  tipo: string,
  payload: any
): Promise<{ success: boolean; error?: string }> {
  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY não configurada')
    return { success: false, error: 'RESEND_API_KEY não configurada' }
  }

  const APP_URL = Deno.env.get('APP_URL') || 'http://localhost:3000'

  let subject = ''
  let html = ''

  switch (tipo) {
    case 'TRIAL_EXPIRANDO':
      subject = `⏰ Seu trial expira em ${payload.dias_restantes} dias`
      html = gerarHtmlTrialExpirando(nomeEmpresa, payload.dias_restantes, `${APP_URL}/configuracoes/assinatura`)
      break

    case 'PAGAMENTO_VENCIDO':
      subject = '⚠️ Pagamento Vencido - Ação Necessária'
      html = gerarHtmlPagamentoVencido(nomeEmpresa, payload.valor, payload.vencimento, `${APP_URL}/configuracoes/assinatura`)
      break

    case 'ASSINATURA_ATIVADA':
      subject = '🎉 Bem-vindo ao SupriFlow!'
      html = gerarHtmlAssinaturaAtivada(nomeEmpresa, payload.plano, `${APP_URL}/dashboard`)
      break

    default:
      return { success: false, error: `Tipo de notificação desconhecido: ${tipo}` }
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: [to],
        subject,
        html,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.message || `HTTP ${response.status}`,
      }
    }

    return { success: true }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
    }
  }
}

// Funções auxiliares para gerar HTML (versão simplificada)
function gerarHtmlTrialExpirando(nomeEmpresa: string, diasRestantes: number, link: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; color: white;">
        <h1>⏰ Seu Trial está Terminando</h1>
      </div>
      <div style="padding: 40px; background: #ffffff;">
        <p>Olá, equipe ${nomeEmpresa}!</p>
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0;">
          <p style="font-weight: 600; color: #92400e; margin: 0 0 8px 0;">
            ⚠️ Restam apenas ${diasRestantes} ${diasRestantes === 1 ? 'dia' : 'dias'} no seu período trial
          </p>
          <p style="margin: 0; color: #92400e;">
            Após este período, o acesso ao sistema será suspenso até que você escolha um plano.
          </p>
        </div>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${link}" style="background: #667eea; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
            Escolher Plano Agora
          </a>
        </div>
      </div>
    </div>
  `
}

function gerarHtmlPagamentoVencido(nomeEmpresa: string, valor: number, vencimento: string, link: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px; text-align: center; color: white;">
        <h1>⚠️ Pagamento Vencido</h1>
      </div>
      <div style="padding: 40px; background: #ffffff;">
        <p>Olá, equipe ${nomeEmpresa}!</p>
        <div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 20px; margin: 24px 0;">
          <p style="font-weight: 600; color: #991b1b; margin: 0 0 8px 0; font-size: 18px;">
            Identificamos um pagamento pendente
          </p>
          <p style="margin: 0; color: #991b1b;">
            O pagamento da sua assinatura venceu em ${vencimento} e ainda não foi identificado.
          </p>
        </div>
        <p>Valor: <strong>R$ ${(valor / 100).toFixed(2)}</strong></p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${link}" style="background: #ef4444; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
            Pagar Agora
          </a>
        </div>
      </div>
    </div>
  `
}

function gerarHtmlAssinaturaAtivada(nomeEmpresa: string, plano: string, link: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center; color: white;">
        <h1>🎉 Bem-vindo ao SupriFlow!</h1>
      </div>
      <div style="padding: 40px; background: #ffffff;">
        <p>Olá, equipe ${nomeEmpresa}!</p>
        <div style="background: linear-gradient(135deg, #e0e7ff 0%, #ddd6fe 100%); padding: 32px; margin: 24px 0; text-align: center; border-radius: 8px;">
          <div style="font-size: 64px; margin-bottom: 16px;">🚀</div>
          <h2 style="margin: 0 0 8px 0; color: #5b21b6;">Assinatura Ativada!</h2>
          <p style="margin: 0; color: #6b21a8; font-size: 18px;">
            Plano <strong>${plano}</strong>
          </p>
        </div>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${link}" style="background: #667eea; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
            Acessar Meu Dashboard
          </a>
        </div>
      </div>
    </div>
  `
}

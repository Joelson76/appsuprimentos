import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import {
  sendPagamentoConfirmadoEmail,
  sendPagamentoVencidoEmail,
  sendAssinaturaAtivadaEmail,
} from '@/lib/email-service-simple'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export async function POST(request: Request) {
  try {
    const payload = await request.json()

    console.log('Webhook Asaas recebido:', payload)

    const { event } = payload

    switch (event) {
      case 'PAYMENT_RECEIVED':
        await handlePaymentReceived(payload)
        break

      case 'PAYMENT_OVERDUE':
        await handlePaymentOverdue(payload)
        break

      case 'PAYMENT_CONFIRMED':
        await handlePaymentConfirmed(payload)
        break

      case 'PAYMENT_REFUNDED':
        await handlePaymentRefunded(payload)
        break

      case 'PAYMENT_DELETED':
        await handlePaymentDeleted(payload)
        break

      default:
        console.log('Evento não tratado:', event)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Erro ao processar webhook Asaas:', error)
    return NextResponse.json(
      { error: 'Erro ao processar webhook' },
      { status: 500 }
    )
  }
}

async function handlePaymentReceived(payload: any) {
  const { payment } = payload

  // Atualizar pagamento no banco
  const { error: updateError } = await supabaseAdmin
    .from('pagamentos')
    .update({
      status: 'PAGO',
      pago_em: new Date().toISOString(),
      metodo_pagamento: payment.billingType,
    })
    .eq('asaas_payment_id', payment.id)

  if (updateError) {
    console.error('Erro ao atualizar pagamento:', updateError)
    return
  }

  // Buscar assinatura vinculada
  const { data: pagamento } = await supabaseAdmin
    .from('pagamentos')
    .select('assinatura_id, assinaturas(tenant_id, status)')
    .eq('asaas_payment_id', payment.id)
    .single()

  if (!pagamento) return

  // Ativar assinatura se estava suspensa ou em trial
  const assinatura = pagamento.assinaturas as any

  if (assinatura.status === 'TRIAL' || assinatura.status === 'INADIMPLENTE' || assinatura.status === 'SUSPENSA') {
    const hoje = new Date()
    const proximoMes = new Date(hoje)
    proximoMes.setMonth(proximoMes.getMonth() + 1)

    await supabaseAdmin
      .from('assinaturas')
      .update({
        status: 'ATIVA',
        periodo_inicio: hoje.toISOString(),
        periodo_fim: proximoMes.toISOString(),
      })
      .eq('id', pagamento.assinatura_id)

    // Criar notificação de boas-vindas
    await supabaseAdmin
      .from('notificacoes_pendentes')
      .insert({
        tenant_id: assinatura.tenant_id,
        tipo: 'ASSINATURA_ATIVADA',
        payload: {
          plano: payment.description,
          valor: payment.value,
        },
      })

    // Enviar e-mail de confirmação
    const { data: tenant } = await supabaseAdmin
      .from('tenants')
      .select('razao_social, email')
      .eq('id', assinatura.tenant_id)
      .single()

    if (tenant?.email) {
      const proximaCobranca = new Date(proximoMes)
      await sendPagamentoConfirmadoEmail(
        tenant.email,
        tenant.razao_social,
        payment.description || 'Plano',
        payment.value * 100,
        proximaCobranca.toLocaleDateString('pt-BR'),
        `${APP_URL}/configuracoes/assinatura`
      )

      // Se for primeira ativação, enviar boas-vindas também
      if (assinatura.status === 'TRIAL') {
        await sendAssinaturaAtivadaEmail(
          tenant.email,
          tenant.razao_social,
          payment.description || 'Plano',
          `${APP_URL}/dashboard`
        )
      }
    }
  }
}

async function handlePaymentOverdue(payload: any) {
  const { payment } = payload

  // Atualizar status do pagamento
  await supabaseAdmin
    .from('pagamentos')
    .update({ status: 'VENCIDO' })
    .eq('asaas_payment_id', payment.id)

  // Buscar assinatura
  const { data: pagamento } = await supabaseAdmin
    .from('pagamentos')
    .select('assinatura_id, assinaturas(tenant_id)')
    .eq('asaas_payment_id', payment.id)
    .single()

  if (!pagamento) return

  // Marcar assinatura como inadimplente
  await supabaseAdmin
    .from('assinaturas')
    .update({ status: 'INADIMPLENTE' })
    .eq('id', pagamento.assinatura_id)

  // Criar notificação
  const assinatura = pagamento.assinaturas as any
  await supabaseAdmin
    .from('notificacoes_pendentes')
    .insert({
      tenant_id: assinatura.tenant_id,
      tipo: 'PAGAMENTO_VENCIDO',
      payload: {
        valor: payment.value,
        vencimento: payment.dueDate,
      },
    })

  // Enviar e-mail de pagamento vencido
  const { data: tenant } = await supabaseAdmin
    .from('tenants')
    .select('razao_social, email')
    .eq('id', assinatura.tenant_id)
    .single()

  if (tenant?.email) {
    await sendPagamentoVencidoEmail(
      tenant.email,
      tenant.razao_social,
      payment.value * 100,
      new Date(payment.dueDate).toLocaleDateString('pt-BR'),
      `${APP_URL}/configuracoes/assinatura`
    )
  }
}

async function handlePaymentConfirmed(payload: any) {
  await handlePaymentReceived(payload)
}

async function handlePaymentRefunded(payload: any) {
  const { payment } = payload

  await supabaseAdmin
    .from('pagamentos')
    .update({ status: 'ESTORNADO' })
    .eq('asaas_payment_id', payment.id)
}

async function handlePaymentDeleted(payload: any) {
  const { payment } = payload

  await supabaseAdmin
    .from('pagamentos')
    .update({ status: 'CANCELADO' })
    .eq('asaas_payment_id', payment.id)
}

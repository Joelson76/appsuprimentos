import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export async function POST(request: Request) {
  try {
    const payload = await request.json()

    console.log('🔔 Webhook Asaas recebido:', {
      event: payload.event,
      payment_id: payload.payment?.id,
      status: payload.payment?.status
    })

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
        console.log('⚠️ Evento não tratado:', event)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('❌ Erro ao processar webhook Asaas:', error)
    return NextResponse.json(
      { error: 'Erro ao processar webhook', details: error.message },
      { status: 500 }
    )
  }
}

async function handlePaymentReceived(payload: any) {
  const { payment } = payload

  console.log('✅ Processando pagamento recebido:', payment.id)

  // Atualizar fatura no banco
  const { data: fatura, error: updateError } = await supabaseAdmin
    .from('faturas')
    .update({
      status: 'PAGO',
      pagamento_em: new Date().toISOString().split('T')[0],
    })
    .eq('asaas_payment_id', payment.id)
    .select('assinatura_id, tenant_id')
    .single()

  if (updateError) {
    console.error('❌ Erro ao atualizar fatura:', updateError)
    return
  }

  if (!fatura) {
    console.log('⚠️ Fatura não encontrada para payment:', payment.id)
    return
  }

  console.log('✅ Fatura atualizada:', fatura)

  // Ativar assinatura
  const { error: assinaturaError } = await supabaseAdmin
    .from('assinaturas')
    .update({ ativa: true })
    .eq('id', fatura.assinatura_id)

  if (assinaturaError) {
    console.error('❌ Erro ao ativar assinatura:', assinaturaError)
  } else {
    console.log('✅ Assinatura ativada!')
  }
}

async function handlePaymentOverdue(payload: any) {
  const { payment } = payload

  console.log('⚠️ Processando pagamento vencido:', payment.id)

  // Atualizar status da fatura
  const { data: fatura } = await supabaseAdmin
    .from('faturas')
    .update({ status: 'VENCIDO' })
    .eq('asaas_payment_id', payment.id)
    .select('assinatura_id')
    .single()

  if (!fatura) return

  // Desativar assinatura
  await supabaseAdmin
    .from('assinaturas')
    .update({ ativa: false })
    .eq('id', fatura.assinatura_id)

  console.log('✅ Assinatura desativada por inadimplência')
}

async function handlePaymentConfirmed(payload: any) {
  await handlePaymentReceived(payload)
}

async function handlePaymentRefunded(payload: any) {
  const { payment } = payload

  console.log('🔄 Processando estorno:', payment.id)

  await supabaseAdmin
    .from('faturas')
    .update({ status: 'ESTORNADO' })
    .eq('asaas_payment_id', payment.id)
}

async function handlePaymentDeleted(payload: any) {
  const { payment } = payload

  console.log('🗑️ Processando cancelamento:', payment.id)

  await supabaseAdmin
    .from('faturas')
    .update({ status: 'CANCELADO' })
    .eq('asaas_payment_id', payment.id)
}

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Webhook do Asaas para receber confirmação de pagamentos
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    console.log('Webhook Asaas recebido:', body)

    const { event, payment } = body

    if (!payment?.externalReference) {
      console.warn('Webhook sem externalReference')
      return NextResponse.json({ received: true })
    }

    const supabase = await createClient()

    // Event types do Asaas:
    // PAYMENT_CREATED, PAYMENT_UPDATED, PAYMENT_CONFIRMED,
    // PAYMENT_RECEIVED, PAYMENT_OVERDUE, PAYMENT_DELETED

    switch (event) {
      case 'PAYMENT_CONFIRMED':
      case 'PAYMENT_RECEIVED':
        // Marcar fatura como paga
        const { error: updateError } = await supabase
          .from('faturas')
          .update({
            status: 'PAGO',
            pagamento_em: new Date().toISOString().split('T')[0],
          })
          .eq('id', payment.externalReference)

        if (updateError) {
          console.error('Erro ao atualizar fatura:', updateError)
          throw updateError
        }

        // Ativar tenant se estava bloqueado
        const { data: fatura } = await supabase
          .from('faturas')
          .select('tenant_id')
          .eq('id', payment.externalReference)
          .single()

        if (fatura?.tenant_id) {
          await supabase
            .from('tenants')
            .update({ status: 'ATIVO' })
            .eq('id', fatura.tenant_id)
            .eq('status', 'BLOQUEADO')
        }

        console.log(`Fatura ${payment.externalReference} marcada como PAGO`)
        break

      case 'PAYMENT_OVERDUE':
        // Marcar fatura como vencida
        await supabase
          .from('faturas')
          .update({ status: 'VENCIDO' })
          .eq('id', payment.externalReference)

        console.log(`Fatura ${payment.externalReference} marcada como VENCIDO`)
        break

      case 'PAYMENT_DELETED':
        // Marcar fatura como cancelada
        await supabase
          .from('faturas')
          .update({ status: 'CANCELADO' })
          .eq('id', payment.externalReference)

        console.log(`Fatura ${payment.externalReference} marcada como CANCELADO`)
        break

      default:
        console.log(`Evento não tratado: ${event}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Erro no webhook Asaas:', error)
    return NextResponse.json(
      { error: 'Erro ao processar webhook' },
      { status: 500 }
    )
  }
}

// Verificar autenticidade do webhook (opcional)
function verifyAsaasWebhook(request: NextRequest): boolean {
  // Asaas envia um token no header "asaas-access-token"
  const token = request.headers.get('asaas-access-token')
  const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN

  if (!expectedToken) {
    console.warn('ASAAS_WEBHOOK_TOKEN não configurado')
    return true // Aceitar mesmo assim em desenvolvimento
  }

  return token === expectedToken
}

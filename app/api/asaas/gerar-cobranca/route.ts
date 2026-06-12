import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const ASAAS_API_URL = process.env.NODE_ENV === 'production'
  ? 'https://api.asaas.com/v3'
  : 'https://sandbox.asaas.com/api/v3'

const ASAAS_API_KEY = process.env.ASAAS_API_KEY

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { faturaId } = await request.json()

    if (!faturaId) {
      return NextResponse.json(
        { error: 'ID da fatura é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar fatura
    const { data: fatura } = await supabase
      .from('faturas')
      .select(`
        *,
        tenant:tenants!faturas_tenant_id_fkey (
          id,
          nome,
          cnpj,
          email
        )
      `)
      .eq('id', faturaId)
      .single()

    if (!fatura) {
      return NextResponse.json(
        { error: 'Fatura não encontrada' },
        { status: 404 }
      )
    }

    // Buscar ou criar customer no Asaas
    let asaasCustomerId = null

    const { data: assinatura } = await supabase
      .from('assinaturas')
      .select('asaas_customer_id')
      .eq('tenant_id', fatura.tenant_id)
      .single()

    if (assinatura?.asaas_customer_id) {
      asaasCustomerId = assinatura.asaas_customer_id
    } else {
      // Criar customer no Asaas
      const customerResponse = await fetch(`${ASAAS_API_URL}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': ASAAS_API_KEY || '',
        },
        body: JSON.stringify({
          name: fatura.tenant.nome,
          cpfCnpj: fatura.tenant.cnpj?.replace(/\D/g, ''),
          email: fatura.tenant.email,
        }),
      })

      if (!customerResponse.ok) {
        const error = await customerResponse.json()
        throw new Error(error.errors?.[0]?.description || 'Erro ao criar cliente no Asaas')
      }

      const customerData = await customerResponse.json()
      asaasCustomerId = customerData.id

      // Salvar customer_id
      await supabase
        .from('assinaturas')
        .update({ asaas_customer_id: asaasCustomerId })
        .eq('tenant_id', fatura.tenant_id)
    }

    // Criar cobrança no Asaas
    const paymentResponse = await fetch(`${ASAAS_API_URL}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access_token': ASAAS_API_KEY || '',
      },
      body: JSON.stringify({
        customer: asaasCustomerId,
        billingType: 'BOLETO', // ou PIX, CREDIT_CARD
        value: Number(fatura.valor),
        dueDate: fatura.vencimento,
        description: fatura.descricao || `Fatura ${fatura.numero}`,
        externalReference: fatura.id,
      }),
    })

    if (!paymentResponse.ok) {
      const error = await paymentResponse.json()
      throw new Error(error.errors?.[0]?.description || 'Erro ao criar cobrança no Asaas')
    }

    const paymentData = await paymentResponse.json()

    // Atualizar fatura com dados do Asaas
    const { error: updateError } = await supabase
      .from('faturas')
      .update({
        asaas_payment_id: paymentData.id,
        asaas_invoice_url: paymentData.invoiceUrl,
        linha_digitavel: paymentData.bankSlipUrl ? paymentData.identificationField : null,
      })
      .eq('id', faturaId)

    if (updateError) {
      throw updateError
    }

    return NextResponse.json({
      success: true,
      payment: {
        id: paymentData.id,
        invoiceUrl: paymentData.invoiceUrl,
        bankSlipUrl: paymentData.bankSlipUrl,
        linhaDigitavel: paymentData.identificationField,
      },
    })
  } catch (error) {
    console.error('Erro ao gerar cobrança:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao gerar cobrança' },
      { status: 500 }
    )
  }
}

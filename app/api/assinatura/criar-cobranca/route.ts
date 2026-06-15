import { createClient } from '@/lib/supabase/server'
import { asaas } from '@/lib/asaas'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }

    const { planoId, metodoPagamento } = await request.json()

    if (!planoId || !metodoPagamento) {
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      )
    }

    // Buscar tenant e assinatura
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('tenant_id, tenants(nome, cnpj)')
      .eq('id', user.id)
      .single()

    if (!profile || profileError) {
      console.error('Erro ao buscar perfil:', profileError)
      return NextResponse.json({
        error: 'Perfil não encontrado',
        details: profileError?.message,
        user_id: user.id
      }, { status: 404 })
    }

    const tenant = profile.tenants as any
    const userEmail = user.email

    // Buscar plano
    const { data: plano } = await supabase
      .from('planos')
      .select('*')
      .eq('id', planoId)
      .single()

    if (!plano) {
      return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 })
    }

    // Buscar ou criar cliente no Asaas
    const { data: assinatura } = await supabase
      .from('assinaturas')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .single()

    let customerId = assinatura?.asaas_customer_id

    if (!customerId) {
      const customer = await asaas.createCustomer({
        name: tenant.nome,
        email: userEmail,
        cpfCnpj: tenant.cnpj.replace(/\D/g, ''),
        externalReference: profile.tenant_id,
      })

      customerId = customer.id

      // Salvar customer_id
      await supabase
        .from('assinaturas')
        .update({ asaas_customer_id: customerId })
        .eq('tenant_id', profile.tenant_id)
    }

    // Criar cobrança recorrente (assinatura)
    const hoje = new Date()
    const proximaCobranca = new Date(hoje)
    proximaCobranca.setMonth(proximaCobranca.getMonth() + 1)

    const subscription = await asaas.createSubscription({
      customer: customerId,
      billingType: metodoPagamento,
      value: plano.preco_centavos / 100,
      nextDueDate: proximaCobranca.toISOString().split('T')[0],
      cycle: 'MONTHLY',
      description: `Assinatura ${plano.nome} - SupriFlow`,
      externalReference: profile.tenant_id,
    })

    // Atualizar assinatura no banco
    await supabase
      .from('assinaturas')
      .update({
        plano_id: planoId,
        asaas_subscription_id: subscription.id,
        status: 'ATIVA',
        periodo_inicio: hoje.toISOString(),
        periodo_fim: proximaCobranca.toISOString(),
      })
      .eq('tenant_id', profile.tenant_id)

    // Buscar primeira cobrança gerada
    const payments = await asaas.getSubscriptionPayments(subscription.id)
    const firstPayment = payments.data[0]

    // Salvar pagamento no banco
    const { data: novoPagamento } = await supabase
      .from('pagamentos')
      .insert({
        assinatura_id: assinatura!.id,
        asaas_payment_id: firstPayment.id,
        valor: plano.preco_centavos / 100,
        vencimento: firstPayment.dueDate,
        status: 'PENDENTE',
        metodo_pagamento: metodoPagamento,
        link_pagamento: firstPayment.invoiceUrl,
      })
      .select()
      .single()

    // Se for PIX, buscar QR Code
    let pixData = null
    if (metodoPagamento === 'PIX') {
      pixData = await asaas.getPixQrCode(firstPayment.id)
    }

    // Se for boleto, buscar URL
    let boletoUrl = null
    if (metodoPagamento === 'BOLETO') {
      boletoUrl = await asaas.getBoletoUrl(firstPayment.id)
    }

    return NextResponse.json({
      success: true,
      pagamento: novoPagamento,
      pix: pixData
        ? {
            payload: pixData.payload,
            encodedImage: pixData.encodedImage,
          }
        : null,
      boleto: boletoUrl ? { url: boletoUrl } : null,
    })
  } catch (error: any) {
    console.error('Erro ao criar cobrança:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao criar cobrança' },
      { status: 500 }
    )
  }
}

import { createClient } from '@/lib/supabase/server'
import { asaas } from '@/lib/asaas'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    console.log('🚀 [1/8] Iniciando criar-cobranca')
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.error('❌ [1/8] Usuário não autenticado')
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    }
    console.log('✅ [1/8] Usuário autenticado:', user.id)

    const { planoId, metodoPagamento } = await request.json()
    console.log('✅ [2/8] Dados recebidos:', { planoId, metodoPagamento })

    if (!planoId || !metodoPagamento) {
      console.error('❌ [2/8] Dados incompletos')
      return NextResponse.json(
        { error: 'Dados incompletos' },
        { status: 400 }
      )
    }

    // Buscar tenant e assinatura
    console.log('🔍 [3/8] Buscando profile...')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('tenant_id, tenants(nome, cnpj)')
      .eq('id', user.id)
      .single()

    if (!profile || profileError) {
      console.error('❌ [3/8] Erro ao buscar perfil:', profileError)
      return NextResponse.json({
        error: 'Perfil não encontrado',
        details: profileError?.message,
        user_id: user.id
      }, { status: 404 })
    }
    console.log('✅ [3/8] Profile encontrado:', profile.tenant_id)

    const tenant = profile.tenants as any
    const userEmail = user.email
    console.log('✅ [3/8] Tenant:', { nome: tenant?.nome, cnpj: tenant?.cnpj })

    // Buscar plano
    console.log('🔍 [4/8] Buscando plano...')
    const { data: plano } = await supabase
      .from('planos')
      .select('*')
      .eq('id', planoId)
      .single()

    if (!plano) {
      console.error('❌ [4/8] Plano não encontrado')
      return NextResponse.json({ error: 'Plano não encontrado' }, { status: 404 })
    }
    console.log('✅ [4/8] Plano:', plano.nome, plano.preco_centavos)

    // Buscar ou criar assinatura e cliente no Asaas
    console.log('🔍 [5/8] Buscando assinatura...')
    let { data: assinatura } = await supabase
      .from('assinaturas')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .maybeSingle()

    // Se não existe, criar registro de assinatura
    if (!assinatura) {
      console.log('🔧 [5/8] Criando registro de assinatura...')
      const { data: novaAssinatura } = await supabase
        .from('assinaturas')
        .insert({
          tenant_id: profile.tenant_id,
          status: 'TRIAL'
        })
        .select()
        .single()
      assinatura = novaAssinatura
      console.log('✅ [5/8] Assinatura criada:', assinatura?.id)
    } else {
      console.log('✅ [5/8] Assinatura encontrada:', assinatura.id)
    }

    let customerId = assinatura?.asaas_customer_id

    if (!customerId) {
      console.log('🔧 [5/8] Criando cliente no Asaas...')
      const customer = await asaas.createCustomer({
        name: tenant.nome,
        email: userEmail,
        cpfCnpj: tenant.cnpj.replace(/\D/g, ''),
        externalReference: profile.tenant_id,
      })

      customerId = customer.id
      console.log('✅ [5/8] Cliente Asaas criado:', customerId)

      // Salvar customer_id
      await supabase
        .from('assinaturas')
        .update({ asaas_customer_id: customerId })
        .eq('id', assinatura!.id)
    } else {
      console.log('✅ [5/8] Cliente Asaas já existe:', customerId)
    }

    // Criar cobrança recorrente (assinatura)
    console.log('🔧 [6/8] Criando subscription no Asaas...')
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
    console.log('✅ [6/8] Subscription criada:', subscription.id)

    // Atualizar assinatura no banco
    console.log('🔧 [6/8] Atualizando assinatura no banco...')
    await supabase
      .from('assinaturas')
      .update({
        plano_id: planoId,
        asaas_subscription_id: subscription.id,
        status: 'ATIVA',
        periodo_inicio: hoje.toISOString(),
        periodo_fim: proximaCobranca.toISOString(),
      })
      .eq('id', assinatura!.id)
    console.log('✅ [6/8] Assinatura atualizada')

    // Buscar primeira cobrança gerada
    console.log('🔍 [7/8] Buscando primeira cobrança...')
    const payments = await asaas.getSubscriptionPayments(subscription.id)
    const firstPayment = payments.data[0]
    console.log('✅ [7/8] Primeira cobrança:', firstPayment.id)

    // Salvar pagamento no banco
    console.log('🔧 [7/8] Salvando pagamento no banco...')
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
    console.log('✅ [7/8] Pagamento salvo:', novoPagamento?.id)

    // Se for PIX, buscar QR Code
    let pixData = null
    if (metodoPagamento === 'PIX') {
      console.log('🔧 [8/8] Buscando QR Code PIX...')
      pixData = await asaas.getPixQrCode(firstPayment.id)
      console.log('✅ [8/8] QR Code obtido')
    }

    // Se for boleto, buscar URL
    let boletoUrl = null
    if (metodoPagamento === 'BOLETO') {
      console.log('🔧 [8/8] Buscando URL do boleto...')
      boletoUrl = await asaas.getBoletoUrl(firstPayment.id)
      console.log('✅ [8/8] Boleto obtido')
    }

    console.log('✅✅✅ [8/8] SUCESSO! Retornando resposta...')
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
    console.error('❌❌❌ ERRO FATAL:', error)
    console.error('Stack:', error.stack)
    return NextResponse.json(
      { error: error.message || 'Erro ao criar cobrança', details: error.toString() },
      { status: 500 }
    )
  }
}

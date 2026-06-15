import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { asaas } from '@/lib/asaas'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    console.log('🚀 [1/8] Iniciando criar-cobranca')
    const supabase = await createClient()

    // Cliente admin para salvar fatura (bypass RLS)
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

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
      console.log('🔍 [5/8] tenant_id a inserir:', profile.tenant_id)
      console.log('🔍 [5/8] user.id:', user.id)

      // Verificar JWT completo
      const { data: { session } } = await supabase.auth.getSession()
      console.log('🔍 [5/8] JWT user completo:', JSON.stringify(user, null, 2))
      console.log('🔍 [5/8] Session user completo:', JSON.stringify(session?.user, null, 2))
      console.log('🔍 [5/8] app_metadata:', session?.user?.app_metadata)
      console.log('🔍 [5/8] user_metadata:', session?.user?.user_metadata)

      const { data: novaAssinatura, error: insertError } = await supabaseAdmin
        .from('assinaturas')
        .insert({
          tenant_id: profile.tenant_id,
          plano: plano.slug, // Usar o slug do plano escolhido (BASICO, PROFISSIONAL, ENTERPRISE)
          valor_mensal: plano.preco_centavos / 100
        })
        .select()
        .single()

      if (insertError) {
        console.error('❌ [5/8] Erro ao inserir assinatura:', insertError)
        return NextResponse.json({
          error: 'Erro ao criar registro de assinatura',
          details: insertError.message,
          code: insertError.code,
          hint: insertError.hint
        }, { status: 500 })
      }

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

    // Atualizar subscription no banco (incluindo plano, mas INATIVA até pagamento)
    console.log('🔧 [6/8] Atualizando assinatura no banco...')
    await supabaseAdmin
      .from('assinaturas')
      .update({
        plano: plano.slug, // Salvar plano escolhido
        valor_mensal: plano.preco_centavos / 100,
        asaas_subscription_id: subscription.id,
        ativa: false, // INATIVA até pagamento confirmado!
        forma_pagamento: metodoPagamento
      })
      .eq('id', assinatura!.id)
    console.log('✅ [6/8] Assinatura atualizada (aguardando pagamento)')

    // Buscar primeira cobrança gerada
    console.log('🔍 [7/8] Buscando primeira cobrança...')
    const payments = await asaas.getSubscriptionPayments(subscription.id)
    const firstPayment = payments.data[0]
    console.log('✅ [7/8] Primeira cobrança:', firstPayment.id)

    // Salvar fatura no banco (usar admin para bypass RLS)
    console.log('🔧 [7/8] Salvando fatura no banco...')
    const numeroFatura = `FAT-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`
    const { data: novaFatura, error: faturaError } = await supabaseAdmin
      .from('faturas')
      .insert({
        tenant_id: profile.tenant_id,
        assinatura_id: assinatura!.id,
        numero: numeroFatura,
        valor: plano.preco_centavos / 100,
        vencimento: firstPayment.dueDate,
        status: 'PENDENTE',
        asaas_payment_id: firstPayment.id,
        asaas_invoice_url: firstPayment.invoiceUrl,
      })
      .select()
      .single()

    if (faturaError || !novaFatura) {
      console.error('❌ [7/8] Erro ao salvar fatura:', faturaError)
      return NextResponse.json({
        error: 'Erro ao salvar fatura',
        details: faturaError?.message
      }, { status: 500 })
    }

    console.log('✅ [7/8] Fatura salva:', novaFatura.id)

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
      fatura: novaFatura,
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

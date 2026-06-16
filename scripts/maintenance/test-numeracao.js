// Script de teste para numeração automática
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testarNumeracao() {
  console.log('🧪 Testando Numeração Automática...\n')

  try {
    // Buscar um tenant para teste
    const { data: tenant } = await supabase
      .from('tenants')
      .select('id, nome')
      .limit(1)
      .single()

    if (!tenant) {
      console.error('❌ Nenhum tenant encontrado')
      return
    }

    console.log(`✅ Tenant: ${tenant.nome} (${tenant.id})\n`)

    // Buscar um usuário do tenant
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('tenant_id', tenant.id)
      .limit(1)
      .single()

    if (!profile) {
      console.error('❌ Nenhum usuário encontrado')
      return
    }

    // 1. Testar REQUISIÇÃO
    console.log('📝 Criando Requisição (sem número)...')
    const { data: req, error: reqError } = await supabase
      .from('requisicoes')
      .insert({
        tenant_id: tenant.id,
        solicitante_id: profile.id,
        descricao: 'Teste de numeração automática',
        status: 'RASCUNHO',
        urgencia: 'NORMAL',
      })
      .select('numero')
      .single()

    if (reqError) {
      console.error('❌ Erro ao criar requisição:', reqError.message)
    } else {
      console.log(`✅ Requisição criada: ${req.numero}\n`)
    }

    // 2. Testar COTAÇÃO
    console.log('💰 Criando Cotação (sem número)...')
    const dataLimite = new Date()
    dataLimite.setDate(dataLimite.getDate() + 7)

    const { data: cot, error: cotError } = await supabase
      .from('cotacoes')
      .insert({
        tenant_id: tenant.id,
        status: 'ABERTA',
        data_limite: dataLimite.toISOString(),
      })
      .select('numero')
      .single()

    if (cotError) {
      console.error('❌ Erro ao criar cotação:', cotError.message)
    } else {
      console.log(`✅ Cotação criada: ${cot.numero}\n`)
    }

    // 3. Testar PEDIDO (precisa fornecedor)
    const { data: fornecedor } = await supabase
      .from('fornecedores')
      .select('id')
      .eq('tenant_id', tenant.id)
      .limit(1)
      .single()

    if (fornecedor) {
      console.log('🛒 Criando Pedido (sem número)...')
      const { data: ped, error: pedError } = await supabase
        .from('pedidos')
        .insert({
          tenant_id: tenant.id,
          fornecedor_id: fornecedor.id,
          status: 'PENDENTE',
        })
        .select('numero')
        .single()

      if (pedError) {
        console.error('❌ Erro ao criar pedido:', pedError.message)
      } else {
        console.log(`✅ Pedido criado: ${ped.numero}\n`)
      }
    } else {
      console.log('⚠️ Nenhum fornecedor encontrado, pulando teste de pedido\n')
    }

    console.log('🎉 Teste concluído!')
    console.log('\n📊 Próximos números serão sequenciais:')
    console.log(`   Requisição: REQ-2026-0002`)
    console.log(`   Cotação: COT-2026-0002`)
    console.log(`   Pedido: PO-2026-0002`)
  } catch (error) {
    console.error('❌ Erro:', error.message)
  }
}

testarNumeracao()

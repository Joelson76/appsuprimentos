// Debug script para testar conexão com Supabase
// Execute: node debug-dashboard.js

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔍 Verificando configuração do Supabase...\n')
console.log('URL:', supabaseUrl ? '✅ Definida' : '❌ Não definida')
console.log('Key:', supabaseKey ? '✅ Definida' : '❌ Não definida')
console.log('')

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    console.log('🔍 Testando conexão com banco de dados...\n')

    // Testar conexão básica
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('id, nome')
      .limit(5)

    if (tenantsError) {
      console.error('❌ Erro ao buscar tenants:', tenantsError.message)
    } else {
      console.log('✅ Conexão com banco OK!')
      console.log(`   ${tenants.length} tenant(s) encontrado(s)`)
      if (tenants.length > 0) {
        tenants.forEach(t => console.log(`   - ${t.nome} (${t.id})`))
      }
    }

    console.log('')

    // Testar profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, nome, perfil')
      .limit(5)

    if (profilesError) {
      console.error('❌ Erro ao buscar profiles:', profilesError.message)
    } else {
      console.log(`✅ ${profiles.length} profile(s) encontrado(s)`)
      if (profiles.length > 0) {
        profiles.forEach(p => console.log(`   - ${p.nome} (${p.perfil})`))
      }
    }

    console.log('\n📊 Resumo:')
    console.log('  - Se não há profiles, o trigger handle_new_user não está funcionando')
    console.log('  - Execute o script FIX_COMPLETO.sql no Supabase')

  } catch (error) {
    console.error('❌ Erro geral:', error.message)
  }
}

testConnection()

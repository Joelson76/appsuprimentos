import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://rmypzuhbfechbxuikyht.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJteXB6dWhiZmVjaGJ4dWlreWh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTA0NDI4NSwiZXhwIjoyMDk2NjIwMjg1fQ.YE_PTOpGx4c3qow6gWL35lGUWPKmiGfbPIVrYNAMTnk'
)

console.log('🔍 Verificando se a tabela email_templates existe...\n')

// Verificar se a tabela existe
const { data: tables, error: tablesError } = await supabase
  .from('email_templates')
  .select('id')
  .limit(1)

if (tablesError) {
  console.error('❌ ERRO: Tabela email_templates NÃO existe!')
  console.error('Código do erro:', tablesError.code)
  console.error('Mensagem:', tablesError.message)
  console.log('\n📋 AÇÃO NECESSÁRIA:')
  console.log('1. Acesse: https://supabase.com/dashboard/project/rmypzuhbfechbxuikyht/editor')
  console.log('2. Execute o SQL: migrations/20260620000002_create_email_templates.sql')
  console.log('3. Execute o SQL: migrations/20260620000003_insert_default_templates.sql')
  process.exit(1)
}

console.log('✅ Tabela email_templates existe!\n')

// Verificar templates
const { data: templates, count } = await supabase
  .from('email_templates')
  .select('*', { count: 'exact' })
  .eq('tenant_id', 'c7f69c82-0968-4190-a26e-eb6005ee3a9c')

console.log(`📧 Templates encontrados: ${count || 0}\n`)

if (!templates || templates.length === 0) {
  console.log('❌ NENHUM template encontrado para seu tenant!')
  console.log('\n📋 AÇÃO NECESSÁRIA:')
  console.log('Execute no Supabase SQL Editor:')
  console.log("SELECT criar_templates_padrao('c7f69c82-0968-4190-a26e-eb6005ee3a9c');")
} else {
  console.log('✅ Templates cadastrados:')
  templates.forEach(t => {
    console.log(`   ${t.ativo ? '✅' : '❌'} ${t.nome} (${t.tipo})`)
  })
}

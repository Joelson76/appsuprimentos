import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://rmypzuhbfechbxuikyht.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJteXB6dWhiZmVjaGJ4dWlreWh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTA0NDI4NSwiZXhwIjoyMDk2NjIwMjg1fQ.YE_PTOpGx4c3qow6gWL35lGUWPKmiGfbPIVrYNAMTnk'
)

console.log('📧 Verificando templates criados...\n')

const { data, count } = await supabase
  .from('email_templates')
  .select('*', { count: 'exact' })
  .eq('tenant_id', 'c7f69c82-0968-4190-a26e-eb6005ee3a9c')

console.log(`Total de templates: ${count}\n`)

if (data && data.length > 0) {
  console.log('✅ Templates encontrados:')
  data.forEach((t, i) => {
    console.log(`\n${i + 1}. ${t.nome}`)
    console.log(`   Tipo: ${t.tipo}`)
    console.log(`   Ativo: ${t.ativo ? '✅ SIM' : '❌ NÃO'}`)
    console.log(`   Assunto: ${t.assunto}`)
    console.log(`   Variáveis: ${Object.keys(t.variaveis_disponiveis || {}).join(', ')}`)
  })
} else {
  console.log('❌ Nenhum template encontrado!')
}

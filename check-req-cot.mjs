import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://rmypzuhbfechbxuikyht.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJteXB6dWhiZmVjaGJ4dWlreWh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTA0NDI4NSwiZXhwIjoyMDk2NjIwMjg1fQ.YE_PTOpGx4c3qow6gWL35lGUWPKmiGfbPIVrYNAMTnk'
)

console.log('🔍 Verificando REQ-2026-0015...\n')

// Buscar a requisição
const { data: req } = await supabase
  .from('requisicoes')
  .select('*, filiais(nome, cnpj)')
  .eq('numero', 'REQ-2026-0015')
  .single()

if (req) {
  console.log(`📝 Requisição: ${req.numero}`)
  console.log(`   Filial ID: ${req.filial_id}`)
  console.log(`   Filial: ${req.filiais?.nome || 'N/A'}`)
  console.log(`   CNPJ: ${req.filiais?.cnpj || 'N/A'}`)
  console.log(`   Status: ${req.status}`)
}

// Buscar cotações relacionadas
console.log('\n💰 Cotações desta requisição:')

const { data: cotacoes } = await supabase
  .from('cotacoes')
  .select('*, filiais(nome, cnpj)')
  .eq('requisicao_id', req.id)

if (cotacoes && cotacoes.length > 0) {
  cotacoes.forEach(cot => {
    console.log(`   ${cot.numero}`)
    console.log(`     Filial ID: ${cot.filial_id}`)
    console.log(`     Filial: ${cot.filiais?.nome || 'N/A'}`)
    console.log(`     CNPJ: ${cot.filiais?.cnpj || 'N/A'}`)
  })
} else {
  console.log('   Nenhuma cotação encontrada')
}

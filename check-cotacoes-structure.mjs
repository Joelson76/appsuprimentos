import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://rmypzuhbfechbxuikyht.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJteXB6dWhiZmVjaGJ4dWlreWh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTA0NDI4NSwiZXhwIjoyMDk2NjIwMjg1fQ.YE_PTOpGx4c3qow6gWL35lGUWPKmiGfbPIVrYNAMTnk'
)

console.log('🔍 Verificando estrutura da tabela cotacoes...\n')

const { data: cotacoes } = await supabase
  .from('cotacoes')
  .select('*')
  .limit(1)

if (cotacoes && cotacoes.length > 0) {
  console.log('Campos da tabela cotacoes:')
  Object.keys(cotacoes[0]).forEach(key => {
    console.log(`  - ${key}`)
  })
} else {
  console.log('Nenhuma cotação encontrada')
}

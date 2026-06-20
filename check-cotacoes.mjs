import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://rmypzuhbfechbxuikyht.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJteXB6dWhiZmVjaGJ4dWlreWh0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTA0NDI4NSwiZXhwIjoyMDk2NjIwMjg1fQ.YE_PTOpGx4c3qow6gWL35lGUWPKmiGfbPIVrYNAMTnk'
)

console.log('📋 Verificando cotações no banco...\n')

const { data: cotacoes, error } = await supabase
  .from('cotacoes')
  .select('id, numero, status, tenant_id')
  .order('criado_em', { ascending: false })

if (error) {
  console.error('❌ Erro:', error.message)
  process.exit(1)
}

console.log(`Total de cotações: ${cotacoes.length}\n`)

// Agrupar por tenant
const porTenant = cotacoes.reduce((acc, cot) => {
  if (!acc[cot.tenant_id]) {
    acc[cot.tenant_id] = []
  }
  acc[cot.tenant_id].push(cot)
  return acc
}, {})

Object.entries(porTenant).forEach(([tenantId, cots]) => {
  console.log(`\n🏢 Tenant: ${tenantId}`)
  console.log(`   Total: ${cots.length} cotações`)
  cots.forEach(c => {
    console.log(`   - ${c.numero} (${c.status})`)
  })
})

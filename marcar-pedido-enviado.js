require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function marcarEnviado() {
  const pedidoId = process.argv[2]

  if (!pedidoId) {
    console.log('❌ Uso: node marcar-pedido-enviado.js <pedido_id>')
    console.log('\nPedidos disponíveis:')

    const { data } = await supabase
      .from('pedidos')
      .select('id, numero, status')
      .order('criado_em', { ascending: false })

    if (data) {
      data.forEach(p => {
        console.log(`  ${p.numero} (${p.status}) - ID: ${p.id}`)
      })
    }
    return
  }

  const { data, error } = await supabase
    .from('pedidos')
    .update({ status: 'ENVIADO' })
    .eq('id', pedidoId)
    .select()
    .single()

  if (error) {
    console.error('❌ Erro:', error)
    return
  }

  console.log(`✅ Pedido ${data.numero} marcado como ENVIADO`)
  console.log(`   URL: http://localhost:3000/pedidos/${data.id}`)
}

marcarEnviado()

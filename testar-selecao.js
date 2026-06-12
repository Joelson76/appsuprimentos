const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testar() {
  const cotacaoId = 'cc2e1937-91dc-4216-8330-d16fc0530d0b'; // COT-2026-0003

  console.log('🧪 Testando seleção de múltiplos itens...\n');

  // Buscar 2 itens de fornecedores diferentes com o mesmo produto
  const { data: itens } = await supabase
    .from('itens_cotacao')
    .select('id, descricao, fornecedor_id, fornecedor:fornecedores(razao_social)')
    .eq('cotacao_id', cotacaoId)
    .limit(2);

  if (itens.length < 2) {
    console.log('❌ Precisa de pelo menos 2 itens');
    return;
  }

  console.log('Vou marcar 2 itens como vencedores:\n');
  
  for (let i = 0; i < 2; i++) {
    console.log(`${i + 1}. ${itens[i].descricao} - ${itens[i].fornecedor.razao_social}`);
    
    // Marcar como vencedor
    await supabase
      .from('itens_cotacao')
      .update({ vencedor: true })
      .eq('id', itens[i].id);
  }

  console.log('\n✅ Itens marcados!\n');

  // Verificar
  const { data: vencedores } = await supabase
    .from('itens_cotacao')
    .select('*, fornecedor:fornecedores(razao_social)')
    .eq('cotacao_id', cotacaoId)
    .eq('vencedor', true);

  console.log(`📊 Total de vencedores: ${vencedores.length}\n`);
  vencedores.forEach(v => {
    console.log(`✅ ${v.descricao} - ${v.fornecedor.razao_social}`);
  });
}

testar();

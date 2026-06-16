const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkRLS() {
  // Tentar inserir um item de teste
  const { data: cotacao } = await supabase
    .from('cotacoes')
    .select('id, tenant_id')
    .eq('numero', 'COT-2026-0001')
    .single();

  const { data: forn } = await supabase
    .from('fornecedores')
    .select('id')
    .limit(1)
    .single();

  console.log('Tentando inserir item de teste...');
  console.log('Cotação ID:', cotacao.id);
  console.log('Tenant ID:', cotacao.tenant_id);
  console.log('Fornecedor ID:', forn?.id);

  const { data, error } = await supabase
    .from('itens_cotacao')
    .insert({
      cotacao_id: cotacao.id,
      fornecedor_id: forn.id,
      descricao: 'TESTE',
      quantidade: 1,
      unidade: 'UN'
    })
    .select();

  if (error) {
    console.log('\n❌ ERRO:', error.message);
    console.log('Código:', error.code);
    console.log('Detalhes:', error.details);
  } else {
    console.log('\n✅ Inserção OK:', data);
  }
}

checkRLS();

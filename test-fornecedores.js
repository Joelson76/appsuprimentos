// Verificar fornecedores cadastrados
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
  console.log('🔍 Buscando fornecedores...\n');

  const { data, error } = await supabase
    .from('fornecedores')
    .select('*')
    .order('criado_em', { ascending: false });

  if (error) {
    console.error('❌ Erro:', error.message);
    console.error('   Código:', error.code);
    return;
  }

  if (!data || data.length === 0) {
    console.log('⚠️ Nenhum fornecedor encontrado');
    return;
  }

  console.log(`✅ ${data.length} fornecedor(es) encontrado(s):\n`);

  data.forEach((forn, index) => {
    console.log(`${index + 1}. ${forn.razao_social}`);
    console.log(`   CNPJ: ${forn.cnpj}`);
    console.log(`   Status: ${forn.status}`);
    console.log(`   Criado em: ${new Date(forn.criado_em).toLocaleString('pt-BR')}\n`);
  });
}

test();

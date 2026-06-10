// Verificar se existem requisições no banco
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
  console.log('🔍 Buscando requisições no banco...\n');

  const { data, error } = await supabase
    .from('requisicoes')
    .select('id, numero, descricao, status')
    .limit(5);

  if (error) {
    console.error('❌ Erro:', error.message);
    return;
  }

  if (!data || data.length === 0) {
    console.log('⚠️ Nenhuma requisição encontrada no banco');
    console.log('   Crie uma requisição primeiro em /requisicoes/nova');
    return;
  }

  console.log(`✅ ${data.length} requisição(ões) encontrada(s):\n`);

  data.forEach((req) => {
    console.log(`   📋 ${req.numero} - ${req.status}`);
    console.log(`      ID: ${req.id}`);
    console.log(`      Link: http://localhost:3000/requisicoes/${req.id}\n`);
  });

  // Testar o primeiro link
  const firstId = data[0].id;
  console.log(`🌐 Testando link da primeira requisição...`);

  try {
    const response = await fetch(`http://localhost:3000/requisicoes/${firstId}`);
    console.log(`   Status: ${response.status}`);

    if (response.status === 404) {
      console.log('   ❌ 404 - Página não encontrada');
      console.log('   Verifique se a página [id]/page.tsx existe');
    } else if (response.status === 200) {
      console.log('   ✅ Página carrega corretamente');
      const html = await response.text();
      if (html.includes('404')) {
        console.log('   ⚠️ Mas contém "404" no HTML - erro de renderização');
      }
    } else if (response.status === 500) {
      console.log('   ❌ 500 - Erro no servidor');
      console.log('   Verifique os logs do Next.js');
    }
  } catch (err) {
    console.error('   ❌ Erro ao testar:', err.message);
  }
}

check();

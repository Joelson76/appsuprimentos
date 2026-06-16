// Testar se o usuário está autenticado e pode buscar requisições
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
  console.log('🔍 Testando autenticação e permissões...\n');

  // 1. Verificar se há sessão
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    console.error('❌ Erro ao buscar sessão:', sessionError.message);
    return;
  }

  if (!session) {
    console.log('⚠️ Nenhuma sessão ativa');
    console.log('   Use o navegador para fazer login e tente novamente\n');
    return;
  }

  console.log('✅ Sessão ativa');
  console.log(`   Usuário: ${session.user.email}\n`);

  // 2. Buscar requisições
  console.log('🔍 Buscando requisições...\n');

  const { data: requisicoes, error: reqError } = await supabase
    .from('requisicoes')
    .select('id, numero, descricao, status')
    .order('criado_em', { ascending: false })
    .limit(5);

  if (reqError) {
    console.error('❌ Erro ao buscar requisições:', reqError.message);
    console.error('   Código:', reqError.code);
    console.error('   Detalhes:', reqError.details);
    console.error('   Hint:', reqError.hint);
    console.log('\n🚨 AS PERMISSÕES NÃO FORAM APLICADAS!');
    console.log('   Execute FIX_PERMISSOES_SEGURO.sql no Supabase');
    return;
  }

  if (!requisicoes || requisicoes.length === 0) {
    console.log('⚠️ Nenhuma requisição encontrada');
    console.log('   Crie uma em: http://localhost:3000/requisicoes/nova\n');
    return;
  }

  console.log(`✅ ${requisicoes.length} requisição(ões) encontrada(s):\n`);

  requisicoes.forEach((req, index) => {
    console.log(`${index + 1}. ${req.numero} - ${req.status}`);
    console.log(`   ID: ${req.id}`);
    console.log(`   Link: http://localhost:3000/requisicoes/${req.id}\n`);
  });

  // 3. Testar buscar uma requisição específica
  const primeiraReq = requisicoes[0];
  console.log(`🔍 Buscando detalhes da requisição ${primeiraReq.numero}...\n`);

  const { data: detalhe, error: detError } = await supabase
    .from('requisicoes')
    .select(`
      *,
      solicitante:profiles!requisicoes_solicitante_id_fkey (nome, email),
      aprovador:profiles!requisicoes_aprovado_por_fkey (nome),
      itens_requisicao (*)
    `)
    .eq('id', primeiraReq.id)
    .single();

  if (detError) {
    console.error('❌ Erro ao buscar detalhes:', detError.message);
    console.error('   Código:', detError.code);

    if (detError.message.includes('Could not find')) {
      console.log('\n⚠️ PROBLEMA: Relacionamento não encontrado');
      console.log('   Possível causa: falta coluna aprovado_por na tabela requisicoes');
    }
    return;
  }

  console.log('✅ Detalhes encontrados:');
  console.log(`   Solicitante: ${detalhe.solicitante?.nome || 'N/A'}`);
  console.log(`   Itens: ${detalhe.itens_requisicao?.length || 0}`);
  console.log(`   Status: ${detalhe.status}\n`);

  console.log('🎉 TUDO FUNCIONANDO!');
  console.log('   Se ainda dá 404 no navegador:');
  console.log('   1. Limpe o cache (Ctrl+Shift+R)');
  console.log('   2. Verifique os logs do Next.js no terminal');
  console.log('   3. Tente em uma aba anônima\n');
}

test();

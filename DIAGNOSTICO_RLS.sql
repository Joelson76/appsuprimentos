-- =====================================================
-- DIAGNÓSTICO COMPLETO DE RLS
-- =====================================================
-- Execute este SQL no Supabase Dashboard para diagnosticar
-- o problema de "permission denied for table cotacoes"
-- =====================================================

-- 1. Verificar se RLS está habilitado
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('cotacoes', 'fornecedores', 'itens_cotacao')
ORDER BY tablename;

-- 2. Listar TODAS as policies existentes
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as operation,
  qual as using_expression,
  with_check
FROM pg_policies
WHERE tablename IN ('cotacoes', 'fornecedores')
ORDER BY tablename, policyname;

-- 3. Verificar se há policies conflitantes
SELECT
  tablename,
  COUNT(*) as total_policies,
  COUNT(*) FILTER (WHERE cmd = 'SELECT') as select_policies,
  COUNT(*) FILTER (WHERE qual = 'true') as public_policies
FROM pg_policies
WHERE tablename IN ('cotacoes', 'fornecedores')
GROUP BY tablename;

-- 4. Testar acesso direto sem RLS (como service_role faria)
SELECT
  'cotacoes' as tabela,
  COUNT(*) as total_registros
FROM cotacoes
UNION ALL
SELECT
  'fornecedores' as tabela,
  COUNT(*) as total_registros
FROM fornecedores;

-- 5. Verificar role atual
SELECT current_user, current_role, session_user;

-- =====================================================
-- SE AS POLICIES PÚBLICAS NÃO ESTIVEREM APARECENDO,
-- EXECUTE O BLOCO ABAIXO:
-- =====================================================

-- OPÇÃO A: Recriar policies (força)
DO $$
BEGIN
  -- Remover todas as policies de SELECT em cotacoes
  DROP POLICY IF EXISTS "cotacoes_public_read" ON cotacoes;
  DROP POLICY IF EXISTS "cotacoes_public_via_token" ON cotacoes;

  -- Criar policy pública para SELECT
  CREATE POLICY "cotacoes_public_read"
    ON cotacoes
    FOR SELECT
    TO public  -- Importante: especificar role public
    USING (true);

  RAISE NOTICE '✅ Policy recriada: cotacoes_public_read';
END $$;

DO $$
BEGIN
  -- Remover todas as policies de SELECT em fornecedores
  DROP POLICY IF EXISTS "fornecedores_public_read" ON fornecedores;

  -- Criar policy pública para SELECT
  CREATE POLICY "fornecedores_public_read"
    ON fornecedores
    FOR SELECT
    TO public  -- Importante: especificar role public
    USING (true);

  RAISE NOTICE '✅ Policy recriada: fornecedores_public_read';
END $$;

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Deve mostrar as 2 policies públicas
SELECT
  tablename,
  policyname,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE policyname LIKE '%public_read%'
ORDER BY tablename;

-- =====================================================
-- SE AINDA NÃO FUNCIONAR, PROBLEMA PODE SER:
-- =====================================================
-- 1. Cliente Supabase não está usando ANON KEY
-- 2. Há outras policies restritivas com permissive = false
-- 3. RLS foi desabilitado acidentalmente
-- =====================================================

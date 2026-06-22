-- =====================================================
-- EXECUTAR ESTE SQL NO SUPABASE DASHBOARD
-- =====================================================
-- URL: https://supabase.com/dashboard
-- Menu: SQL Editor > New Query
-- Cole este arquivo completo e clique RUN
-- =====================================================

-- Verificar policies existentes
SELECT
  schemaname,
  tablename,
  policyname,
  cmd as operation,
  qual as using_expression
FROM pg_policies
WHERE tablename IN ('cotacoes', 'fornecedores')
ORDER BY tablename, policyname;

-- =====================================================
-- CRIAR POLICIES DE LEITURA PÚBLICA
-- =====================================================

-- 1. Cotações - Permitir leitura pública
DO $$
BEGIN
  -- Remover policy antiga se existir
  DROP POLICY IF EXISTS "cotacoes_public_via_token" ON cotacoes;
  DROP POLICY IF EXISTS "cotacoes_public_read" ON cotacoes;

  -- Criar nova policy
  CREATE POLICY "cotacoes_public_read"
    ON cotacoes
    FOR SELECT
    USING (true);

  RAISE NOTICE '✅ Policy criada: cotacoes_public_read';
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE '⚠️ Policy já existe: cotacoes_public_read';
END $$;

-- 2. Fornecedores - Permitir leitura pública
DO $$
BEGIN
  -- Remover policy antiga se existir
  DROP POLICY IF EXISTS "fornecedores_public_read" ON fornecedores;

  -- Criar nova policy
  CREATE POLICY "fornecedores_public_read"
    ON fornecedores
    FOR SELECT
    USING (true);

  RAISE NOTICE '✅ Policy criada: fornecedores_public_read';
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE '⚠️ Policy já existe: fornecedores_public_read';
END $$;

-- =====================================================
-- VERIFICAR SE FOI APLICADO CORRETAMENTE
-- =====================================================

-- Listar policies após criação
SELECT
  tablename,
  policyname,
  cmd as operation,
  CASE
    WHEN qual = 'true' THEN '✅ Acesso público'
    ELSE qual
  END as acesso
FROM pg_policies
WHERE tablename IN ('cotacoes', 'fornecedores')
  AND policyname LIKE '%public%'
ORDER BY tablename;

-- =====================================================
-- RESULTADO ESPERADO:
-- =====================================================
-- Você deve ver 2 linhas:
-- cotacoes       | cotacoes_public_read       | SELECT | ✅ Acesso público
-- fornecedores   | fornecedores_public_read   | SELECT | ✅ Acesso público
-- =====================================================

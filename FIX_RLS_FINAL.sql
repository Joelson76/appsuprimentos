-- =====================================================
-- CORREÇÃO FINAL RLS - EXECUTAR NO SUPABASE AGORA
-- =====================================================

-- 1. REMOVER todas as policies antigas de SELECT
DROP POLICY IF EXISTS "cotacoes_public_read" ON cotacoes;
DROP POLICY IF EXISTS "cotacoes_public_via_token" ON cotacoes;
DROP POLICY IF EXISTS "cotacoes_allow_anon_select" ON cotacoes;

DROP POLICY IF EXISTS "fornecedores_public_read" ON fornecedores;
DROP POLICY IF EXISTS "fornecedores_allow_anon_select" ON fornecedores;

-- 2. CRIAR policies CORRETAS (permitir acesso a TODOS os roles)
CREATE POLICY "cotacoes_select_all"
  ON cotacoes
  FOR SELECT
  USING (true);

CREATE POLICY "fornecedores_select_all"
  ON fornecedores
  FOR SELECT
  USING (true);

-- 3. VERIFICAR
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('cotacoes', 'fornecedores')
ORDER BY tablename, policyname;

-- =====================================================
-- RESULTADO ESPERADO:
-- Você deve ver:
-- cotacoes      | cotacoes_select_all      | PERMISSIVE | {public} | SELECT | true
-- fornecedores  | fornecedores_select_all  | PERMISSIVE | {public} | SELECT | true
--
-- O {public} aqui significa "todos os roles" quando USING (true)
-- =====================================================

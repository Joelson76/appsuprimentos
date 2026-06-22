-- =====================================================
-- CORREÇÃO FINAL: Policies para role ANON
-- =====================================================
-- O Supabase usa o role 'anon' quando não está autenticado,
-- não 'public'. Precisamos recriar as policies.
-- =====================================================

-- 1. REMOVER policies antigas
DROP POLICY IF EXISTS "cotacoes_public_read" ON cotacoes;
DROP POLICY IF EXISTS "cotacoes_public_via_token" ON cotacoes;

DROP POLICY IF EXISTS "fornecedores_public_read" ON fornecedores;

-- 2. CRIAR policies SEM especificar role (aplica para todos)
CREATE POLICY "cotacoes_allow_anon_select"
  ON cotacoes
  FOR SELECT
  USING (true);

CREATE POLICY "fornecedores_allow_anon_select"
  ON fornecedores
  FOR SELECT
  USING (true);

-- 3. VERIFICAR se foram criadas corretamente
SELECT
  tablename,
  policyname,
  roles,
  cmd as operation,
  qual as using_clause
FROM pg_policies
WHERE tablename IN ('cotacoes', 'fornecedores')
  AND policyname LIKE '%anon%'
ORDER BY tablename;

-- =====================================================
-- RESULTADO ESPERADO:
-- =====================================================
-- cotacoes      | cotacoes_allow_anon_select      | {public} | SELECT | true
-- fornecedores  | fornecedores_allow_anon_select  | {public} | SELECT | true
--
-- NOTA: Mesmo mostrando {public}, isso aplica para TODOS os roles,
-- incluindo 'anon', 'authenticated', etc.
-- =====================================================

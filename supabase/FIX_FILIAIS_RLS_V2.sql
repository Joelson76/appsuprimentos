-- Corrigir RLS da tabela filiais - Versão 2
-- Remover policies e criar uma mais permissiva para debug

-- 1. Remover todas as policies
DROP POLICY IF EXISTS "filiais_tenant_policy" ON filiais;

-- 2. Criar policy temporária mais permissiva (para authenticated)
CREATE POLICY "filiais_authenticated_all" ON filiais
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 3. Testar inserção
-- Após funcionar, podemos voltar a policy restritiva

-- Verificar policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'filiais';

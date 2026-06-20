-- Corrigir RLS da tabela filiais
-- O tenant_id está em app_metadata, não user_metadata

-- 1. Adicionar permissões GRANT
GRANT SELECT, INSERT, UPDATE, DELETE ON public.filiais TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 2. Remover policy antiga
DROP POLICY IF EXISTS "filiais_tenant_policy" ON filiais;

-- 3. Criar policy correta usando app_metadata (igual às outras tabelas)
CREATE POLICY "filiais_tenant_policy" ON filiais
  FOR ALL
  USING (tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID))
  WITH CHECK (tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID));

-- Verificar
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'filiais';

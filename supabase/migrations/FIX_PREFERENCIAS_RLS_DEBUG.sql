-- ==========================================
-- DEBUG: RLS preferencias_notificacao
-- Versão mais permissiva para debug
-- ==========================================

-- Desabilitar RLS temporariamente para testar
ALTER TABLE preferencias_notificacao DISABLE ROW LEVEL SECURITY;

-- Reabilitar RLS
ALTER TABLE preferencias_notificacao ENABLE ROW LEVEL SECURITY;

-- Remover todas policies antigas
DROP POLICY IF EXISTS "preferencias_own" ON preferencias_notificacao;
DROP POLICY IF EXISTS "preferencias_insert" ON preferencias_notificacao;
DROP POLICY IF EXISTS "preferencias_select" ON preferencias_notificacao;
DROP POLICY IF EXISTS "preferencias_update" ON preferencias_notificacao;
DROP POLICY IF EXISTS "preferencias_delete" ON preferencias_notificacao;

-- Policy SUPER PERMISSIVA para INSERT (qualquer usuário autenticado)
CREATE POLICY "preferencias_insert_debug" ON preferencias_notificacao
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy SUPER PERMISSIVA para SELECT
CREATE POLICY "preferencias_select_debug" ON preferencias_notificacao
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy SUPER PERMISSIVA para UPDATE
CREATE POLICY "preferencias_update_debug" ON preferencias_notificacao
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy SUPER PERMISSIVA para DELETE
CREATE POLICY "preferencias_delete_debug" ON preferencias_notificacao
  FOR DELETE
  TO authenticated
  USING (true);

-- ==========================================
-- VERIFICAR STATUS
-- ==========================================
DO $$
DECLARE
  v_rls_enabled BOOLEAN;
  v_policies INTEGER;
BEGIN
  -- Verificar se RLS está ativo
  SELECT relrowsecurity INTO v_rls_enabled
  FROM pg_class
  WHERE relname = 'preferencias_notificacao';

  -- Contar policies
  SELECT COUNT(*) INTO v_policies
  FROM pg_policies
  WHERE tablename = 'preferencias_notificacao';

  RAISE NOTICE '================================================';
  RAISE NOTICE 'DEBUG: preferencias_notificacao';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'RLS Habilitado: %', v_rls_enabled;
  RAISE NOTICE 'Policies criadas: %', v_policies;
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Policies SUPER PERMISSIVAS ativadas para DEBUG';
  RAISE NOTICE 'Qualquer usuário autenticado pode fazer tudo';
  RAISE NOTICE '================================================';
END $$;

-- Listar todas policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'preferencias_notificacao';

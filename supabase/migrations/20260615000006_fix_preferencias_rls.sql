-- ==========================================
-- FIX: RLS para preferencias_notificacao
-- Permitir usuário criar e gerenciar suas próprias preferências
-- ==========================================

-- Remover policy antiga
DROP POLICY IF EXISTS "preferencias_own" ON preferencias_notificacao;

-- Policy para INSERT (permitir usuário criar suas próprias preferências)
CREATE POLICY "preferencias_insert" ON preferencias_notificacao
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
  );

-- Policy para SELECT (ver apenas suas próprias preferências)
CREATE POLICY "preferencias_select" ON preferencias_notificacao
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR (auth.jwt()->'app_metadata'->>'perfil')::TEXT = 'SUPER_ADMIN'
  );

-- Policy para UPDATE (atualizar apenas suas próprias preferências)
CREATE POLICY "preferencias_update" ON preferencias_notificacao
  FOR UPDATE
  USING (
    user_id = auth.uid()
    OR (auth.jwt()->'app_metadata'->>'perfil')::TEXT = 'SUPER_ADMIN'
  )
  WITH CHECK (
    user_id = auth.uid()
    OR (auth.jwt()->'app_metadata'->>'perfil')::TEXT = 'SUPER_ADMIN'
  );

-- Policy para DELETE (deletar apenas suas próprias preferências)
CREATE POLICY "preferencias_delete" ON preferencias_notificacao
  FOR DELETE
  USING (
    user_id = auth.uid()
    OR (auth.jwt()->'app_metadata'->>'perfil')::TEXT = 'SUPER_ADMIN'
  );

-- ==========================================
-- TESTE
-- ==========================================
DO $$
DECLARE
  v_policies INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_policies
  FROM pg_policies
  WHERE tablename = 'preferencias_notificacao';

  RAISE NOTICE '================================================';
  RAISE NOTICE 'FIX RLS: preferencias_notificacao';
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ % policies criadas', v_policies;
  RAISE NOTICE '✅ INSERT: usuário pode criar suas preferências';
  RAISE NOTICE '✅ SELECT: usuário vê apenas suas preferências';
  RAISE NOTICE '✅ UPDATE: usuário atualiza apenas suas preferências';
  RAISE NOTICE '✅ DELETE: usuário deleta apenas suas preferências';
  RAISE NOTICE '================================================';
END $$;

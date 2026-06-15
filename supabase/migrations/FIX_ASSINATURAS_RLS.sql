-- ==========================================
-- FIX: RLS para assinaturas
-- Corrigir policy para funcionar com JWT
-- ==========================================

-- Remover policy antiga
DROP POLICY IF EXISTS "assinaturas_tenant" ON assinaturas;

-- Policy correta usando JWT
CREATE POLICY "assinaturas_tenant" ON assinaturas
  FOR ALL
  USING (
    tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID)
    OR (auth.jwt()->'app_metadata'->>'perfil')::TEXT = 'SUPER_ADMIN'
  );

-- Dar permissões para role authenticated
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assinaturas TO authenticated;

-- ==========================================
-- TESTE
-- ==========================================
DO $$
BEGIN
  RAISE NOTICE '================================================';
  RAISE NOTICE 'FIX RLS: assinaturas';
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ Policy criada usando JWT tenant_id';
  RAISE NOTICE '✅ GRANTS aplicados para authenticated';
  RAISE NOTICE '================================================';
END $$;

SELECT '✅ RLS de assinaturas corrigido!' as status;

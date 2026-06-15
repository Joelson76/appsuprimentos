-- ==========================================
-- FIX: Policy de assinaturas para permitir INSERT
-- ==========================================

DROP POLICY IF EXISTS "assinaturas_tenant" ON assinaturas;

-- Policy completa com USING e WITH CHECK
CREATE POLICY "assinaturas_tenant" ON assinaturas
  FOR ALL
  USING (
    tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID)
    OR (auth.jwt()->'app_metadata'->>'perfil')::TEXT = 'SUPER_ADMIN'
  )
  WITH CHECK (
    tenant_id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID)
    OR (auth.jwt()->'app_metadata'->>'perfil')::TEXT = 'SUPER_ADMIN'
  );

-- Garantir permissões
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assinaturas TO authenticated;

SELECT '✅ Policy de assinaturas corrigida para permitir INSERT!' as status;

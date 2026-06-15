-- ==========================================
-- FIX: RLS para profiles e tenants
-- Corrigir para permitir acesso via JWT
-- ==========================================

-- ==========================================
-- PROFILES
-- ==========================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Remover policies antigas
DROP POLICY IF EXISTS "profiles_own_tenant" ON profiles;
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;

-- Policy: Usuário vê seu próprio perfil
CREATE POLICY "profiles_own" ON profiles
  FOR SELECT
  USING (id = auth.uid());

-- Policy: Usuário atualiza seu próprio perfil
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Policy: Super admin vê tudo
CREATE POLICY "profiles_super_admin" ON profiles
  FOR ALL
  USING ((auth.jwt()->'app_metadata'->>'perfil')::TEXT = 'SUPER_ADMIN');

-- Dar permissões
GRANT SELECT, UPDATE ON public.profiles TO authenticated;

-- ==========================================
-- TENANTS
-- ==========================================
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Remover policies antigas
DROP POLICY IF EXISTS "tenants_own" ON tenants;
DROP POLICY IF EXISTS "tenants_select" ON tenants;

-- Policy: Usuário acessa seu próprio tenant
CREATE POLICY "tenants_own" ON tenants
  FOR ALL
  USING (
    id = ((auth.jwt()->'app_metadata'->>'tenant_id')::UUID)
    OR (auth.jwt()->'app_metadata'->>'perfil')::TEXT = 'SUPER_ADMIN'
  );

-- Policy alternativa: Usuário acessa tenant via profile
CREATE POLICY "tenants_via_profile" ON tenants
  FOR SELECT
  USING (
    id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Dar permissões
GRANT SELECT, UPDATE ON public.tenants TO authenticated;

-- ==========================================
-- VERIFICAR
-- ==========================================
DO $$
DECLARE
  v_profiles_policies INTEGER;
  v_tenants_policies INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_profiles_policies
  FROM pg_policies WHERE tablename = 'profiles';

  SELECT COUNT(*) INTO v_tenants_policies
  FROM pg_policies WHERE tablename = 'tenants';

  RAISE NOTICE '================================================';
  RAISE NOTICE 'FIX RLS: profiles e tenants';
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ profiles: % policies', v_profiles_policies;
  RAISE NOTICE '✅ tenants: % policies', v_tenants_policies;
  RAISE NOTICE '✅ GRANTS aplicados';
  RAISE NOTICE '================================================';
END $$;

SELECT '✅ RLS de profiles e tenants corrigido!' as status;

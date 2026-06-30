-- FIX: Recursão infinita nas políticas RLS de profiles
-- Problema: Políticas tentavam consultar profiles dentro de políticas de profiles
-- Solução: Usar auth.uid() diretamente sem subquery em profiles

-- Remover todas as políticas atuais de profiles
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles_insert" ON profiles;
DROP POLICY IF EXISTS "profiles_update" ON profiles;
DROP POLICY IF EXISTS "profiles_delete" ON profiles;
DROP POLICY IF EXISTS "profiles_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_super_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_own_tenant" ON profiles;

-- Policies corretas para profiles (sem recursão)
-- SELECT: usuário vê seu próprio perfil + perfis do mesmo tenant
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT TO authenticated
  USING (
    id = auth.uid() OR
    tenant_id = (SELECT tenant_id FROM profiles WHERE id = auth.uid() LIMIT 1)
  );

-- INSERT: apenas durante criação via trigger (não usado manualmente)
CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- UPDATE: usuário só pode atualizar seu próprio perfil
CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- DELETE: ninguém deleta profiles manualmente (CASCADE via tenant)
CREATE POLICY "profiles_delete" ON profiles
  FOR DELETE TO authenticated
  USING (false);

COMMENT ON POLICY "profiles_select" ON profiles IS
'Usuário vê seu perfil + perfis do mesmo tenant. CUIDADO: não fazer subquery recursiva!';

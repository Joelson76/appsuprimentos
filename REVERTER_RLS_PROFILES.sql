-- ============================================
-- REVERTER: Policies RLS de profiles
-- E criar apenas as essenciais
-- ============================================

-- 1. Remover TODAS as policies de profiles
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can read tenant profiles" ON profiles;
DROP POLICY IF EXISTS "Usuários podem ver seu próprio profile" ON profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio profile" ON profiles;
DROP POLICY IF EXISTS "profiles_isolamento" ON profiles;
DROP POLICY IF EXISTS "profiles_own_tenant" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Allow users to read own profile" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to read own profile" ON profiles;

-- 2. Criar policies SIMPLES e SEGURAS

-- Permitir que QUALQUER usuário autenticado veja seu próprio profile
CREATE POLICY "profiles_select_own"
ON profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Permitir que QUALQUER usuário autenticado atualize seu próprio profile
CREATE POLICY "profiles_update_own"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Permitir INSERT apenas pelo service_role (API)
-- Usuários normais NÃO podem criar profiles diretamente

-- Permitir DELETE apenas pelo service_role (API)
-- Usuários normais NÃO podem deletar profiles

-- 3. Verificar policies criadas
SELECT
  '=== POLICIES APÓS LIMPEZA ===' as info,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 4. Verificar se consegue ver próprio profile
SELECT
  '=== TESTE: VER PRÓPRIO PROFILE ===' as info,
  id,
  nome,
  perfil,
  tenant_id,
  CASE WHEN tenant_id IS NOT NULL THEN '✅ TEM TENANT' ELSE '❌ SEM TENANT' END as status
FROM profiles
WHERE id = auth.uid();

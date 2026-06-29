-- ============================================
-- FIX: RLS policies para tabela profiles
-- Permitir que usuário veja seu próprio profile
-- ============================================

-- 1. Ver policies atuais de profiles
SELECT
  '=== POLICIES ATUAIS DE PROFILES ===' as info,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles';

-- 2. Dropar policies antigas se existirem (pode dar erro se não existir, é normal)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Allow users to read own profile" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users to read own profile" ON profiles;

-- 3. Criar policy CORRETA para permitir usuário ver próprio profile
-- IMPORTANTE: Esta policy permite que o usuário veja SEU PRÓPRIO profile
-- mesmo sem especificar tenant_id
CREATE POLICY "Users can read own profile"
ON profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 4. Policy para permitir UPDATE do próprio profile
CREATE POLICY "Users can update own profile"
ON profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 5. Policy para ADMIN/SUPER_ADMIN ver profiles do mesmo tenant
CREATE POLICY "Admins can read tenant profiles"
ON profiles
FOR SELECT
TO authenticated
USING (
  tenant_id IN (
    SELECT tenant_id FROM profiles WHERE id = auth.uid()
  )
  AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND perfil IN ('ADMIN', 'SUPER_ADMIN')
  )
);

-- 6. Verificar se RLS está habilitado
SELECT
  '=== RLS STATUS ===' as info,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'profiles';

-- 7. Testar: Ver próprio profile (deve funcionar)
SELECT
  '=== TESTE: MEU PROFILE ===' as info,
  id,
  nome,
  perfil,
  tenant_id
FROM profiles
WHERE id = auth.uid();

-- 8. Ver policies criadas
SELECT
  '=== POLICIES FINAIS ===' as info,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

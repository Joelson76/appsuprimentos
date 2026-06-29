-- 🔧 LIMPAR E RECRIAR RLS - Profiles
-- Execute TUDO de uma vez no Supabase SQL Editor

-- 1. DESABILITAR RLS temporariamente
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 2. DROPAR TODAS AS POLICIES (ignora erros se não existir)
DROP POLICY IF EXISTS "profiles_tenant" ON profiles;
DROP POLICY IF EXISTS "profiles_self_access" ON profiles;
DROP POLICY IF EXISTS "profiles_tenant_isolation" ON profiles;
DROP POLICY IF EXISTS "profiles_self_update" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_system" ON profiles;
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON profiles;

-- 3. VERIFICAR que todas foram removidas
SELECT COUNT(*) as total_policies
FROM pg_policies
WHERE tablename = 'profiles';
-- Deve retornar: 0

-- 4. REATIVAR RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 5. CRIAR APENAS UMA POLICY SIMPLES
CREATE POLICY "profiles_simple_select"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

-- 6. VERIFICAR que foi criada
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'profiles';
-- Deve retornar apenas: profiles_simple_select

-- 7. TESTAR (como usuário logado, não postgres)
-- SELECT * FROM profiles WHERE id = auth.uid();
-- Deve retornar SEU profile sem erro de recursão

-- ✅ RESULTADO ESPERADO:
-- - 0 policies antigas
-- - 1 policy nova (profiles_simple_select)
-- - Query funciona sem recursão
-- - Login deve funcionar

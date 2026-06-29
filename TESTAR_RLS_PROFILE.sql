-- ============================================
-- TESTAR: Se o RLS está bloqueando a leitura do próprio profile
-- ============================================

-- 1. Ver MEU profile diretamente (ignorando RLS temporariamente)
-- Execute isso como SUPER_ADMIN no Supabase para ver a verdade
SELECT
  '=== MEU PROFILE (IGNORANDO RLS) ===' as info,
  p.id,
  u.email,
  p.nome,
  p.perfil,
  p.tenant_id,
  CASE WHEN p.tenant_id IS NULL THEN '❌ NULL!' ELSE '✅ TEM TENANT' END as status
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'joelson76@gmail.com';

-- 2. Ver se a policy está permitindo a leitura
-- Esta query simula o que acontece COM RLS ativo
SET ROLE authenticated;
SET request.jwt.claims.sub = (SELECT id::text FROM auth.users WHERE email = 'joelson76@gmail.com');

SELECT
  '=== MEU PROFILE (COM RLS) ===' as info,
  id,
  nome,
  perfil,
  tenant_id
FROM profiles
WHERE id = auth.uid();

RESET ROLE;

-- 3. Ver TODAS as policies que afetam profiles
SELECT
  '=== TODAS AS POLICIES DE PROFILES ===' as info,
  policyname,
  cmd,
  permissive,
  roles,
  qual as using_clause,
  with_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 4. Desabilitar RLS TEMPORARIAMENTE para testar
-- ATENÇÃO: Isso é só para teste, vamos reativar depois!
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

SELECT '=== RLS DESABILITADO (TEMPORÁRIO PARA TESTE) ===' as info;

-- 5. Verificar status do RLS
SELECT
  '=== STATUS RLS ===' as info,
  schemaname,
  tablename,
  rowsecurity as rls_ativo
FROM pg_tables
WHERE tablename = 'profiles';

-- ============================================
-- SOLUÇÃO SIMPLES: Desabilitar RLS temporariamente
-- ============================================

-- 1. Ver seu profile atual
SELECT
  '=== SEU PROFILE ATUAL ===' as info,
  p.id,
  u.email,
  p.nome,
  p.perfil,
  p.tenant_id,
  CASE WHEN p.tenant_id IS NULL THEN '❌ SEM TENANT!' ELSE '✅ TEM TENANT' END as status
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'joelson76@gmail.com';

-- 2. Desabilitar RLS temporariamente
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 3. Verificar
SELECT
  '=== RLS DESABILITADO ===' as info,
  tablename,
  rowsecurity as rls_ativo
FROM pg_tables
WHERE tablename = 'profiles';

SELECT '✅ PRONTO! Agora tente criar o usuário Lucas novamente!' as mensagem;

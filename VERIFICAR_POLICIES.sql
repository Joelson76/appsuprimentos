-- 🔍 VERIFICAR POLICIES EXISTENTES

-- 1. Ver todas policies da tabela profiles
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 2. Verificar RLS status
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'profiles';

-- ==========================================
-- DIAGNÓSTICO COMPLETO: Tabela assinaturas
-- ==========================================

-- 1. Triggers na tabela assinaturas
SELECT
  t.tgname as trigger_name,
  p.proname as function_name,
  pg_get_triggerdef(t.oid) as trigger_definition
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgrelid = 'assinaturas'::regclass
  AND NOT t.tgisinternal;

-- 2. Policies RLS na tabela assinaturas
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
WHERE tablename = 'assinaturas';

-- 3. Foreign keys que referenciam assinaturas
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND ccu.table_name = 'assinaturas';

-- 4. Views que usam assinaturas
SELECT
  schemaname,
  viewname,
  definition
FROM pg_views
WHERE definition ILIKE '%assinaturas%'
  AND schemaname = 'public';

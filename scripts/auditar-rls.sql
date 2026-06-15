-- ==========================================
-- SCRIPT DE AUDITORIA DE RLS
-- Verifica segurança de todas as tabelas do SaaS
-- ==========================================

-- 1. LISTAR TABELAS SEM RLS HABILITADO
-- ==========================================
SELECT
  schemaname,
  tablename,
  '❌ RLS NÃO HABILITADO' as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT IN ('schema_migrations', 'spatial_ref_sys')
  AND tablename NOT IN (
    SELECT tablename
    FROM pg_tables t
    JOIN pg_class c ON c.relname = t.tablename
    WHERE c.relrowsecurity = true
    AND t.schemaname = 'public'
  )
ORDER BY tablename;

-- 2. LISTAR TABELAS COM tenant_id MAS SEM POLICY
-- ==========================================
SELECT
  t.tablename,
  '⚠️ TEM tenant_id MAS SEM POLICY' as status
FROM pg_tables t
WHERE t.schemaname = 'public'
  AND EXISTS (
    SELECT 1 FROM information_schema.columns c
    WHERE c.table_name = t.tablename
      AND c.column_name = 'tenant_id'
      AND c.table_schema = 'public'
  )
  AND NOT EXISTS (
    SELECT 1 FROM pg_policies p
    WHERE p.tablename = t.tablename
      AND p.schemaname = 'public'
  )
ORDER BY t.tablename;

-- 3. LISTAR TODAS AS POLICIES ATIVAS
-- ==========================================
SELECT
  schemaname,
  tablename,
  policyname,
  CASE
    WHEN cmd = '*' THEN 'ALL'
    WHEN cmd = 'r' THEN 'SELECT'
    WHEN cmd = 'w' THEN 'INSERT/UPDATE'
    WHEN cmd = 'a' THEN 'INSERT'
    WHEN cmd = 'd' THEN 'DELETE'
  END as comando,
  qual as condicao
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 4. VERIFICAR TABELAS COM DADOS SENSÍVEIS
-- ==========================================
-- Tabelas que DEVEM ter RLS obrigatoriamente
WITH tabelas_sensiveis AS (
  SELECT unnest(ARRAY[
    'tenants',
    'profiles',
    'requisicoes',
    'cotacoes',
    'pedidos',
    'fornecedores',
    'contratos',
    'notas_fiscais',
    'estoque',
    'assinaturas',
    'pagamentos',
    'usuarios',
    'notificacoes_pendentes'
  ]) as tabela
)
SELECT
  ts.tabela,
  CASE
    WHEN c.relrowsecurity THEN '✅ RLS HABILITADO'
    ELSE '❌ RLS DESABILITADO - CRÍTICO!'
  END as status,
  COUNT(p.policyname) as num_policies
FROM tabelas_sensiveis ts
LEFT JOIN pg_class c ON c.relname = ts.tabela
LEFT JOIN pg_policies p ON p.tablename = ts.tabela AND p.schemaname = 'public'
GROUP BY ts.tabela, c.relrowsecurity
ORDER BY
  CASE WHEN c.relrowsecurity THEN 1 ELSE 0 END,
  ts.tabela;

-- 5. VERIFICAR FOREIGN KEYS SEM CASCADE
-- ==========================================
-- FK sem ON DELETE CASCADE podem vazar dados entre tenants
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  rc.delete_rule,
  CASE
    WHEN rc.delete_rule = 'CASCADE' THEN '✅ OK'
    ELSE '⚠️ SEM CASCADE'
  END as status
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND kcu.column_name = 'tenant_id'
ORDER BY tc.table_name;

-- 6. CONTAR REGISTROS POR TENANT
-- ==========================================
-- Útil para detectar vazamento de dados
DO $$
DECLARE
  r RECORD;
  sql TEXT;
BEGIN
  FOR r IN
    SELECT table_name
    FROM information_schema.columns
    WHERE column_name = 'tenant_id'
      AND table_schema = 'public'
      AND table_name NOT LIKE '%_old%'
  LOOP
    sql := format('
      SELECT
        ''%I'' as tabela,
        tenant_id,
        COUNT(*) as registros
      FROM %I
      GROUP BY tenant_id
      ORDER BY registros DESC
      LIMIT 5
    ', r.table_name, r.table_name);

    RAISE NOTICE 'Tabela: %', r.table_name;
    EXECUTE sql;
  END LOOP;
END $$;

-- 7. VERIFICAR SE SERVICE_ROLE ESTÁ SENDO USADA INCORRETAMENTE
-- ==========================================
-- service_role NÃO deve ser usada no frontend
COMMENT ON SCHEMA public IS '
⚠️ IMPORTANTE:
- Frontend DEVE usar anon key (respeita RLS)
- Backend/Edge Functions podem usar service_role (bypassa RLS)
- NUNCA exponha service_role no código frontend
';

-- 8. RELATÓRIO RESUMIDO
-- ==========================================
SELECT
  'RESUMO DE SEGURANÇA' as categoria,
  (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public') as total_tabelas,
  (SELECT COUNT(*) FROM pg_tables t
   JOIN pg_class c ON c.relname = t.tablename
   WHERE c.relrowsecurity = true AND t.schemaname = 'public') as tabelas_com_rls,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') as total_policies,
  (SELECT COUNT(DISTINCT tablename) FROM pg_policies WHERE schemaname = 'public') as tabelas_com_policy;

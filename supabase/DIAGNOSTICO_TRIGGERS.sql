-- ==========================================
-- DIAGNÓSTICO: Verificar triggers e funções ativos
-- ==========================================

-- 1. Listar TODOS os triggers na tabela tenants
SELECT
  t.tgname as trigger_name,
  p.proname as function_name,
  pg_get_triggerdef(t.oid) as trigger_definition
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgrelid = 'tenants'::regclass
  AND NOT t.tgisinternal;

-- 2. Ver o código da função que está sendo chamada
SELECT
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_code
FROM pg_proc p
WHERE p.proname LIKE '%subscription%'
   OR p.proname LIKE '%tenant%'
   OR p.proname LIKE '%trial%'
ORDER BY p.proname;

-- 3. Verificar estrutura da tabela assinaturas
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'assinaturas'
ORDER BY ordinal_position;

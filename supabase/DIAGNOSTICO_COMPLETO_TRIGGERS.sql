-- ==========================================
-- DIAGNÓSTICO COMPLETO: Todos os triggers que podem criar assinatura
-- ==========================================

-- 1. Triggers em AUTH.USERS (podem disparar ao criar usuário)
SELECT
  t.tgname as trigger_name,
  p.proname as function_name,
  pg_get_triggerdef(t.oid) as trigger_definition
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE t.tgrelid = 'auth.users'::regclass
  AND NOT t.tgisinternal;

-- 2. Triggers em PROFILES
SELECT
  t.tgname as trigger_name,
  p.proname as function_name,
  pg_get_triggerdef(t.oid) as trigger_definition
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgrelid = 'profiles'::regclass
  AND NOT t.tgisinternal;

-- 3. Código de TODAS as funções que mencionam 'assinaturas'
SELECT
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_code
FROM pg_proc p
WHERE pg_get_functiondef(p.oid) ILIKE '%assinaturas%'
ORDER BY p.proname;

-- 4. Procurar especificamente por 'plano_id' em funções
SELECT
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_code
FROM pg_proc p
WHERE pg_get_functiondef(p.oid) ILIKE '%plano_id%'
ORDER BY p.proname;

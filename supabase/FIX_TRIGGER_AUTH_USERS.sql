-- ==========================================
-- FIX: Remover trigger quebrado em auth.users
-- ==========================================
-- Problema: Trigger chama função auto_create_usuario que não existe
-- ==========================================

-- 1. Dropar o trigger quebrado
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Verificar se ainda existem triggers em auth.users
SELECT
  t.tgname as trigger_name,
  p.proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgrelid = 'auth.users'::regclass
  AND NOT t.tgisinternal;

-- 3. Verificar a função auto_create_trial_subscription (deve estar correta)
SELECT pg_get_functiondef('auto_create_trial_subscription'::regproc);

-- Mensagem
SELECT 'Trigger quebrado removido! Teste o cadastro agora.' as status;

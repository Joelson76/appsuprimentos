-- ==========================================
-- FIX: Remover trigger duplicado que causa erro
-- ==========================================
-- Problema: Existem 2 triggers criando assinatura, um tem código antigo
-- ==========================================

-- 1. Ver código da função problemática
SELECT pg_get_functiondef('criar_assinatura_trial'::regproc);

-- 2. Dropar o trigger e função duplicados
DROP TRIGGER IF EXISTS tenant_cria_assinatura ON tenants;
DROP FUNCTION IF EXISTS criar_assinatura_trial();

-- 3. Manter apenas o trigger correto (auto_create_trial_subscription)
-- Ele já existe e está funcionando corretamente

-- 4. Verificar triggers finais em tenants
SELECT
  t.tgname as trigger_name,
  p.proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgrelid = 'tenants'::regclass
  AND NOT t.tgisinternal
ORDER BY t.tgname;

-- Mensagem
SELECT 'Trigger duplicado removido! Agora tem apenas 1 trigger criando assinatura.' as status;

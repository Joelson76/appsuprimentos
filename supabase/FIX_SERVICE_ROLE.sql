-- ==========================================
-- FIX: Permitir service_role usar as tabelas
-- ==========================================
-- Problema: RLS está bloqueando o service_role
-- Solução: Dar permissões explícitas

-- 1. Grant ALL para service_role em todas as tabelas
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- 2. Grant para tabelas futuras (auto)
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON FUNCTIONS TO service_role;

-- 3. Importante: service_role BYPASS RLS (sempre teve, mas garantir)
-- No Supabase, service_role já tem bypassrls por padrão
-- Mas se precisar forçar:
-- ALTER ROLE service_role BYPASSRLS;

-- ==========================================
-- PRONTO! Agora o cadastro deve funcionar
-- ==========================================

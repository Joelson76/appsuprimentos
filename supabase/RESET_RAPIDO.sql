-- ==========================================
-- RESET RÁPIDO - Remove tudo de uma vez
-- ==========================================
-- ⚠️ Use este se estiver começando do zero
-- Mais rápido e seguro que o LIMPAR_BANCO.sql

-- 1. Dropar o schema public e recriar (mais rápido)
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- 2. Reativar extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- ==========================================
-- PRONTO! Agora aplique as 5 migrations na ordem
-- ==========================================

-- ORDEM CORRETA:
-- 1. 20250101000000_fase1_inicial.sql
-- 2. 20250102000000_fase2_compras.sql
-- 3. 20250103000000_fase3_fiscal_contratos.sql
-- 4. 20250104000000_fase4_estoque_dashboard.sql
-- 5. 20250105000000_fase5_saas.sql

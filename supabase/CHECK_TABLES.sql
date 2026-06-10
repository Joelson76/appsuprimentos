-- ==========================================
-- VERIFICAR QUAIS TABELAS EXISTEM
-- ==========================================
-- Execute este script para ver quais tabelas você tem
-- ==========================================

SELECT
  tablename as "Tabela",
  CASE
    WHEN rowsecurity THEN '✅ RLS Habilitado'
    ELSE '❌ RLS Desabilitado'
  END as "RLS"
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT LIKE 'pg_%'
  AND tablename NOT LIKE 'sql_%'
ORDER BY tablename;

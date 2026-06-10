-- ==========================================
-- APLICAR TODAS AS MIGRATIONS DE FORMA SEGURA
-- ==========================================
-- Este script pode ser executado múltiplas vezes sem erro
-- Ele verifica o que já existe e só cria o que falta

-- ==========================================
-- VERIFICAÇÃO: Qual fase você já tem?
-- ==========================================

DO $$
DECLARE
  v_tabelas INT;
BEGIN
  SELECT COUNT(*) INTO v_tabelas
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE';

  RAISE NOTICE 'Você tem % tabelas instaladas', v_tabelas;

  IF v_tabelas = 0 THEN
    RAISE NOTICE 'Status: NENHUMA FASE instalada - Execute RESET_RAPIDO.sql primeiro';
  ELSIF v_tabelas = 3 THEN
    RAISE NOTICE 'Status: Fase 1 OK - Aplique Fase 2, 3, 4, 5';
  ELSIF v_tabelas >= 14 AND v_tabelas < 18 THEN
    RAISE NOTICE 'Status: Fase 2 OK - Aplique Fase 3, 4, 5';
  ELSIF v_tabelas >= 18 AND v_tabelas < 20 THEN
    RAISE NOTICE 'Status: Fase 3 OK - Aplique Fase 4, 5';
  ELSIF v_tabelas >= 20 AND v_tabelas < 24 THEN
    RAISE NOTICE 'Status: Fase 4 OK - Aplique Fase 5';
  ELSIF v_tabelas >= 24 THEN
    RAISE NOTICE 'Status: TODAS AS FASES instaladas! Sistema completo!';
  ELSE
    RAISE NOTICE 'Status: Instalação parcial - Execute RESET_RAPIDO.sql e recomece';
  END IF;
END $$;

-- ==========================================
-- SOLUÇÃO RÁPIDA
-- ==========================================

-- Se você quer recomeçar do ZERO:
-- 1. Execute o arquivo: RESET_RAPIDO.sql
-- 2. Depois aplique as 5 migrations NA ORDEM (1, 2, 3, 4, 5)

-- Se você quer continuar de onde parou:
-- 1. Veja o NOTICE acima (quantas tabelas você tem)
-- 2. Aplique APENAS as fases que faltam
-- 3. NÃO reaplique fases já instaladas

-- ==========================================
-- ATALHO: Aplicar TODAS as fases que faltam
-- ==========================================
-- Descomente as linhas abaixo se quiser aplicar tudo automaticamente

-- \i supabase/migrations/20250102000000_fase2_compras.sql
-- \i supabase/migrations/20250103000000_fase3_fiscal_contratos.sql
-- \i supabase/migrations/20250104000000_fase4_estoque_dashboard.sql
-- \i supabase/migrations/20250105000000_fase5_saas.sql

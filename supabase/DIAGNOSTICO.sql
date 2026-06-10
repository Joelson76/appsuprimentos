-- ==========================================
-- DIAGNÓSTICO - Verificar estado do banco
-- ==========================================
-- Execute este script para ver o que está configurado
-- ==========================================

-- Verificar quais tabelas existem
DO $$
DECLARE
  tabela record;
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'TABELAS EXISTENTES:';
  RAISE NOTICE '===========================================';

  FOR tabela IN
    SELECT tablename, rowsecurity
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename NOT LIKE 'pg_%'
    ORDER BY tablename
  LOOP
    IF tabela.rowsecurity THEN
      RAISE NOTICE '✅ % (RLS ativo)', tabela.tablename;
    ELSE
      RAISE NOTICE '⚠️ % (RLS DESATIVADO!)', tabela.tablename;
    END IF;
  END LOOP;

  RAISE NOTICE '===========================================';
END $$;

-- Verificar permissões da role authenticated
DO $$
DECLARE
  perm record;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'PERMISSÕES DA ROLE authenticated:';
  RAISE NOTICE '===========================================';

  FOR perm IN
    SELECT
      table_name,
      string_agg(privilege_type, ', ' ORDER BY privilege_type) as privileges
    FROM information_schema.table_privileges
    WHERE grantee = 'authenticated'
    AND table_schema = 'public'
    GROUP BY table_name
    ORDER BY table_name
  LOOP
    RAISE NOTICE '  %: %', perm.table_name, perm.privileges;
  END LOOP;

  IF NOT FOUND THEN
    RAISE NOTICE '  ❌ NENHUMA PERMISSÃO ENCONTRADA!';
    RAISE NOTICE '  Execute FIX_PERMISSOES_SEGURO.sql para adicionar';
  END IF;

  RAISE NOTICE '===========================================';
END $$;

-- Verificar políticas RLS
DO $$
DECLARE
  pol record;
  tabela TEXT;
  count_pol INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'POLÍTICAS RLS POR TABELA:';
  RAISE NOTICE '===========================================';

  FOR tabela IN
    SELECT DISTINCT tablename
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename
  LOOP
    SELECT COUNT(*) INTO count_pol
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = tabela;

    RAISE NOTICE '  %: % política(s)', tabela, count_pol;

    FOR pol IN
      SELECT policyname, cmd
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename = tabela
      ORDER BY policyname
    LOOP
      RAISE NOTICE '    - % (%)', pol.policyname, pol.cmd;
    END LOOP;
  END LOOP;

  IF NOT FOUND THEN
    RAISE NOTICE '  ❌ NENHUMA POLÍTICA RLS ENCONTRADA!';
    RAISE NOTICE '  Execute FIX_PERMISSOES_SEGURO.sql para criar';
  END IF;

  RAISE NOTICE '===========================================';
END $$;

-- Verificar colunas de itens_requisicao
DO $$
DECLARE
  col record;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'COLUNAS DA TABELA itens_requisicao:';
  RAISE NOTICE '===========================================';

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'itens_requisicao') THEN
    FOR col IN
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'itens_requisicao'
      ORDER BY ordinal_position
    LOOP
      RAISE NOTICE '  % (%, nullable: %)', col.column_name, col.data_type, col.is_nullable;
    END LOOP;
  ELSE
    RAISE NOTICE '  ❌ Tabela itens_requisicao NÃO EXISTE!';
  END IF;

  RAISE NOTICE '===========================================';
END $$;

-- Resumo final
DO $$
DECLARE
  tem_permissoes BOOLEAN;
  tem_politicas BOOLEAN;
  tem_rls BOOLEAN;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'RESUMO DO DIAGNÓSTICO:';
  RAISE NOTICE '===========================================';

  -- Verificar permissões
  SELECT EXISTS (
    SELECT 1 FROM information_schema.table_privileges
    WHERE grantee = 'authenticated'
    AND table_schema = 'public'
    AND table_name = 'requisicoes'
  ) INTO tem_permissoes;

  IF tem_permissoes THEN
    RAISE NOTICE '✅ Role authenticated TEM permissões em requisicoes';
  ELSE
    RAISE NOTICE '❌ Role authenticated NÃO TEM permissões em requisicoes';
    RAISE NOTICE '   Execute: FIX_PERMISSOES_SEGURO.sql';
  END IF;

  -- Verificar políticas
  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'requisicoes'
  ) INTO tem_politicas;

  IF tem_politicas THEN
    RAISE NOTICE '✅ Tabela requisicoes TEM políticas RLS';
  ELSE
    RAISE NOTICE '❌ Tabela requisicoes NÃO TEM políticas RLS';
    RAISE NOTICE '   Execute: FIX_PERMISSOES_SEGURO.sql';
  END IF;

  -- Verificar RLS ativo
  SELECT rowsecurity INTO tem_rls
  FROM pg_tables
  WHERE schemaname = 'public'
  AND tablename = 'requisicoes';

  IF tem_rls THEN
    RAISE NOTICE '✅ RLS está ATIVO em requisicoes';
  ELSE
    RAISE NOTICE '⚠️ RLS está DESATIVADO em requisicoes';
    RAISE NOTICE '   Execute: FIX_PERMISSOES_SEGURO.sql';
  END IF;

  RAISE NOTICE '===========================================';

  IF tem_permissoes AND tem_politicas AND tem_rls THEN
    RAISE NOTICE '🎉 TUDO CONFIGURADO CORRETAMENTE!';
    RAISE NOTICE 'Se ainda dá erro, o problema pode ser:';
    RAISE NOTICE '  1. Cache do navegador (Ctrl+Shift+R)';
    RAISE NOTICE '  2. Sessão expirada (faça login novamente)';
    RAISE NOTICE '  3. Erro na query (veja logs do Next.js)';
  ELSE
    RAISE NOTICE '❌ CONFIGURAÇÃO INCOMPLETA!';
    RAISE NOTICE 'Execute FIX_PERMISSOES_SEGURO.sql no SQL Editor';
  END IF;

  RAISE NOTICE '===========================================';
END $$;

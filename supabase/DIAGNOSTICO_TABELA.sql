-- ==========================================
-- DIAGNÓSTICO - Retorna resultados em tabela
-- ==========================================
-- Este script retorna os dados na aba Results
-- ==========================================

-- Verificar permissões em requisicoes
SELECT
  'Permissões' as categoria,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.table_privileges
      WHERE grantee = 'authenticated'
      AND table_schema = 'public'
      AND table_name = 'requisicoes'
    ) THEN '✅ authenticated TEM permissões em requisicoes'
    ELSE '❌ authenticated NÃO TEM permissões em requisicoes - EXECUTE FIX_PERMISSOES_SEGURO.sql'
  END as status

UNION ALL

-- Verificar políticas RLS em requisicoes
SELECT
  'Políticas RLS' as categoria,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
      AND tablename = 'requisicoes'
    ) THEN '✅ requisicoes TEM políticas RLS (' ||
            (SELECT COUNT(*)::text FROM pg_policies WHERE tablename = 'requisicoes') ||
            ' políticas)'
    ELSE '❌ requisicoes NÃO TEM políticas RLS - EXECUTE FIX_PERMISSOES_SEGURO.sql'
  END as status

UNION ALL

-- Verificar se RLS está ativo
SELECT
  'RLS Ativo' as categoria,
  CASE
    WHEN (SELECT rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'requisicoes')
    THEN '✅ RLS está ATIVO em requisicoes'
    ELSE '❌ RLS está DESATIVADO em requisicoes - EXECUTE FIX_PERMISSOES_SEGURO.sql'
  END as status

UNION ALL

-- Verificar permissões em itens_requisicao
SELECT
  'Itens Permissões' as categoria,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.table_privileges
      WHERE grantee = 'authenticated'
      AND table_schema = 'public'
      AND table_name = 'itens_requisicao'
    ) THEN '✅ authenticated TEM permissões em itens_requisicao'
    ELSE '❌ authenticated NÃO TEM permissões em itens_requisicao'
  END as status

UNION ALL

-- Verificar campo observacao
SELECT
  'Campo observacao' as categoria,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'itens_requisicao'
      AND column_name = 'observacao'
    ) THEN '✅ Campo observacao EXISTE em itens_requisicao'
    ELSE '❌ Campo observacao NÃO EXISTE - EXECUTE ADD_OBSERVACAO_CAMPO.sql'
  END as status

UNION ALL

-- Verificar campo produto
SELECT
  'Campo produto' as categoria,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'itens_requisicao'
      AND column_name = 'produto'
    ) THEN '✅ Campo produto EXISTE em itens_requisicao'
    ELSE '❌ Campo produto NÃO EXISTE - EXECUTE ADD_OBSERVACAO_CAMPO.sql'
  END as status

UNION ALL

-- RESUMO FINAL
SELECT
  '🎯 RESUMO' as categoria,
  CASE
    WHEN (
      -- Tem permissões
      EXISTS (
        SELECT 1 FROM information_schema.table_privileges
        WHERE grantee = 'authenticated'
        AND table_schema = 'public'
        AND table_name = 'requisicoes'
      )
      AND
      -- Tem políticas
      EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'requisicoes'
      )
      AND
      -- RLS está ativo
      (SELECT rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'requisicoes')
    ) THEN '🎉 TUDO CONFIGURADO! Se ainda dá 404, veja logs do Next.js'
    ELSE '❌ CONFIGURAÇÃO INCOMPLETA - Execute FIX_PERMISSOES_SEGURO.sql AGORA'
  END as status

ORDER BY categoria;
